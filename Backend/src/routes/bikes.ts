import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ─── Helper: run a prepared statement returning all rows ──────────────────────
function queryAll<T>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

function queryOne<T>(sql: string, params: any[] = []): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

function run(sql: string, params: any[] = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

// ─── Helper: Assemble a full Bike object from DB rows ─────────────────────────
function assembleBike(bikeRow: Record<string, unknown>) {
  const id = bikeRow.id as string;

  const additionalCosts = queryAll<{ id: string; type: string; label: string | null; amount: number }>(
    `SELECT id, type, label, amount FROM additional_costs WHERE bike_id = ? ORDER BY sort_order ASC`,
    [id]
  );

  const images = queryAll<{ id: string; category: string; url: string }>(
    `SELECT id, category, url FROM bike_images WHERE bike_id = ? ORDER BY sort_order ASC`,
    [id]
  );

  const sale = queryOne<Record<string, unknown>>(
    `SELECT * FROM sales WHERE bike_id = ?`,
    [id]
  );

  const bikeImages = images.filter(i => i.category === 'bike').map(i => i.url);
  const ownerDocImages = images.filter(i => i.category === 'owner_doc').map(i => i.url);
  const buyerDocImages = images.filter(i => i.category === 'buyer_doc').map(i => i.url);

  return {
    id,
    model: bikeRow.model,
    bikeNumber: bikeRow.bike_number,
    color: bikeRow.color || undefined,
    yearOfManufacture: bikeRow.year_of_manufacture || undefined,
    status: bikeRow.status,
    images: bikeImages,
    owner: {
      name: (bikeRow.owner_name as string) || '',
      nic: (bikeRow.owner_nic as string) || '',
      photos: ownerDocImages,
    },
    buying: {
      date: bikeRow.buying_date,
      directCost: bikeRow.direct_cost,
    },
    additionalCosts: additionalCosts.map(c => ({
      id: c.id,
      type: c.type,
      label: c.label || undefined,
      amount: c.amount,
    })),
    selling: sale
      ? {
          soldDate: sale.sold_date,
          sellingPrice: sale.selling_price,
          notes: (sale.notes as string) || '',
          buyer: {
            name: (sale.buyer_name as string) || '',
            contactNumber: (sale.buyer_contact as string) || '',
            nic: (sale.buyer_nic as string) || '',
            documents: buyerDocImages,
          },
        }
      : undefined,
  };
}

// ─── GET /api/bikes ────────────────────────────────────────────────────────────
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const bikes = queryAll<Record<string, unknown>>(`SELECT * FROM bikes ORDER BY created_at DESC`);
    res.json({ data: bikes.map(assembleBike) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bikes.' });
  }
});

// ─── GET /api/bikes/:id ────────────────────────────────────────────────────────
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const bike = queryOne<Record<string, unknown>>(`SELECT * FROM bikes WHERE id = ?`, [req.params.id]);
    if (!bike) { res.status(404).json({ error: 'Bike not found.' }); return; }
    res.json({ data: assembleBike(bike) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bike.' });
  }
});

// ─── POST /api/bikes ───────────────────────────────────────────────────────────
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const body = req.body as {
      id?: string;
      model: string;
      bikeNumber: string;
      color?: string;
      yearOfManufacture?: string;
      images?: string[];
      owner?: { name?: string; nic?: string; photos?: string[] };
      buying: { date: string; directCost: number };
      additionalCosts?: { id?: string; type: string; label?: string; amount: number }[];
    };

    if (!body.model || !body.bikeNumber || !body.buying?.date) {
      res.status(400).json({ error: 'model, bikeNumber, and buying.date are required.' });
      return;
    }

    const id = body.id || uuidv4();
    const now = new Date().toISOString();

    run(
      `INSERT OR IGNORE INTO bikes (id, model, bike_number, color, year_of_manufacture, status, buying_date, direct_cost, owner_name, owner_nic, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'In Stock', ?, ?, ?, ?, ?, ?)`,
      [id, body.model, body.bikeNumber, body.color || null, body.yearOfManufacture || null,
       body.buying.date, body.buying.directCost || 0,
       body.owner?.name || null, body.owner?.nic || null, now, now]
    );

    body.additionalCosts?.forEach((c, i) => {
      run(`INSERT INTO additional_costs (id, bike_id, type, label, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        [c.id || uuidv4(), id, c.type, c.label || null, c.amount, i]);
    });

    body.images?.forEach((url, i) => {
      run(`INSERT INTO bike_images (id, bike_id, category, url, sort_order) VALUES (?, ?, 'bike', ?, ?)`,
        [uuidv4(), id, url, i]);
    });

    body.owner?.photos?.forEach((url, i) => {
      run(`INSERT INTO bike_images (id, bike_id, category, url, sort_order) VALUES (?, ?, 'owner_doc', ?, ?)`,
        [uuidv4(), id, url, i]);
    });

    const created = queryOne<Record<string, unknown>>(`SELECT * FROM bikes WHERE id = ?`, [id])!;
    res.status(201).json({ data: assembleBike(created) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create bike.' });
  }
});

// ─── PUT /api/bikes/:id ────────────────────────────────────────────────────────
router.put('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    if (!queryOne(`SELECT id FROM bikes WHERE id = ?`, [id])) {
      res.status(404).json({ error: 'Bike not found.' }); return;
    }

    const body = req.body as {
      model: string;
      bikeNumber: string;
      color?: string;
      yearOfManufacture?: string;
      images?: string[];
      owner?: { name?: string; nic?: string; photos?: string[] };
      buying: { date: string; directCost: number };
      additionalCosts?: { id?: string; type: string; label?: string; amount: number }[];
    };

    const now = new Date().toISOString();

    run(
      `UPDATE bikes SET model=?, bike_number=?, color=?, year_of_manufacture=?, buying_date=?, direct_cost=?, owner_name=?, owner_nic=?, updated_at=? WHERE id=?`,
      [body.model, body.bikeNumber, body.color || null, body.yearOfManufacture || null,
       body.buying.date, body.buying.directCost || 0,
       body.owner?.name || null, body.owner?.nic || null, now, id]
    );

    run(`DELETE FROM additional_costs WHERE bike_id = ?`, [id]);
    body.additionalCosts?.forEach((c, i) => {
      run(`INSERT INTO additional_costs (id, bike_id, type, label, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        [c.id || uuidv4(), id, c.type, c.label || null, c.amount, i]);
    });

    run(`DELETE FROM bike_images WHERE bike_id = ? AND category IN ('bike', 'owner_doc')`, [id]);
    body.images?.forEach((url, i) => {
      run(`INSERT INTO bike_images (id, bike_id, category, url, sort_order) VALUES (?, ?, 'bike', ?, ?)`,
        [uuidv4(), id, url, i]);
    });
    body.owner?.photos?.forEach((url, i) => {
      run(`INSERT INTO bike_images (id, bike_id, category, url, sort_order) VALUES (?, ?, 'owner_doc', ?, ?)`,
        [uuidv4(), id, url, i]);
    });

    const updated = queryOne<Record<string, unknown>>(`SELECT * FROM bikes WHERE id = ?`, [id])!;
    res.json({ data: assembleBike(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update bike.' });
  }
});

// ─── DELETE /api/bikes/:id ─────────────────────────────────────────────────────
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    if (!queryOne(`SELECT id FROM bikes WHERE id = ?`, [id])) {
      res.status(404).json({ error: 'Bike not found.' }); return;
    }
    run(`DELETE FROM bikes WHERE id = ?`, [id]);
    res.json({ data: { message: 'Bike deleted successfully.' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete bike.' });
  }
});

// ─── POST /api/bikes/:id/sell ──────────────────────────────────────────────────
router.post('/:id/sell', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    if (!queryOne(`SELECT id FROM bikes WHERE id = ?`, [id])) {
      res.status(404).json({ error: 'Bike not found.' }); return;
    }

    const body = req.body as {
      soldDate: string;
      sellingPrice: number;
      notes?: string;
      buyer?: { name?: string; contactNumber?: string; nic?: string; documents?: string[] };
    };

    if (!body.soldDate || !body.sellingPrice) {
      res.status(400).json({ error: 'soldDate and sellingPrice are required.' }); return;
    }

    const now = new Date().toISOString();

    run(
      `INSERT INTO sales (id, bike_id, sold_date, selling_price, buyer_name, buyer_contact, buyer_nic, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(bike_id) DO UPDATE SET
         sold_date=excluded.sold_date, selling_price=excluded.selling_price,
         buyer_name=excluded.buyer_name, buyer_contact=excluded.buyer_contact,
         buyer_nic=excluded.buyer_nic, notes=excluded.notes`,
      [uuidv4(), id, body.soldDate, body.sellingPrice,
       body.buyer?.name || null, body.buyer?.contactNumber || null,
       body.buyer?.nic || null, body.notes || null]
    );

    run(`UPDATE bikes SET status='Sold', updated_at=? WHERE id=?`, [now, id]);

    run(`DELETE FROM bike_images WHERE bike_id = ? AND category = 'buyer_doc'`, [id]);
    body.buyer?.documents?.forEach((url, i) => {
      run(`INSERT INTO bike_images (id, bike_id, category, url, sort_order) VALUES (?, ?, 'buyer_doc', ?, ?)`,
        [uuidv4(), id, url, i]);
    });

    const updated = queryOne<Record<string, unknown>>(`SELECT * FROM bikes WHERE id = ?`, [id])!;
    res.json({ data: assembleBike(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record sale.' });
  }
});

export default router;
