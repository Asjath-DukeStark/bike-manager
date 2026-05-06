import { Router, Response } from 'express';
import db from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/summary', requireAuth, (_req: AuthRequest, res: Response): void => {
  try {
    const soldBikes = db.prepare(`
      SELECT b.id, b.model, b.buying_date, b.direct_cost, s.sold_date, s.selling_price
      FROM bikes b
      INNER JOIN sales s ON s.bike_id = b.id
      WHERE b.status = 'Sold'
    `).all() as { id: string; model: string; buying_date: string; direct_cost: number; sold_date: string; selling_price: number }[];

    const costTotals = db.prepare(`
      SELECT bike_id, SUM(amount) as total_additional FROM additional_costs GROUP BY bike_id
    `).all() as { bike_id: string; total_additional: number }[];

    const costMap = new Map(costTotals.map(c => [c.bike_id, c.total_additional]));

    let totalRevenue = 0, totalCost = 0, totalProfit = 0, totalDaysToSell = 0;
    const monthlyMap = new Map<string, { count: number; profit: number; revenue: number }>();
    const modelMap = new Map<string, number>();

    soldBikes.forEach(bike => {
      const additionalCost = costMap.get(bike.id) || 0;
      const totalBikeCost = bike.direct_cost + additionalCost;
      const profit = bike.selling_price - totalBikeCost;
      totalRevenue += bike.selling_price;
      totalCost += totalBikeCost;
      totalProfit += profit;

      const days = Math.ceil(Math.abs(new Date(bike.sold_date).getTime() - new Date(bike.buying_date).getTime()) / 86400000);
      totalDaysToSell += days;

      const d = new Date(bike.sold_date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { count: 0, profit: 0, revenue: 0 });
      const entry = monthlyMap.get(monthKey)!;
      entry.count++; entry.profit += profit; entry.revenue += bike.selling_price;

      modelMap.set(bike.model, (modelMap.get(bike.model) || 0) + 1);
    });

    const count = soldBikes.length;
    const inStockCount = (db.prepare(`SELECT COUNT(*) as c FROM bikes WHERE status = 'In Stock'`).get() as { c: number }).c;

    res.json({
      data: {
        overview: {
          inStock: inStockCount,
          totalSold: count,
          totalRevenue,
          totalCost,
          totalProfit,
          averageProfit: count ? totalProfit / count : 0,
          averageTime: count ? Math.floor(totalDaysToSell / count) : 0,
        },
        monthlyData: Array.from(monthlyMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, data]) => ({ month, ...data })),
        topModels: Array.from(modelMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

export default router;
