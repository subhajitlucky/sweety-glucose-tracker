import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDate, formatDayNumber } from '../lib/dates.js';
import { IconChart, IconLeaf } from './Icons.jsx';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <span>{formatDate(point.date)}</span>
      <strong>{Number(point.average).toFixed(1)} mg/dL</strong>
      <small>
        Daily average · {point.count} {point.count === 1 ? 'reading' : 'readings'}
      </small>
    </div>
  );
}

export default function TrendChart({ report, loading }) {
  const trend = report?.trend || [];
  const values = trend.map((point) => Number(point.average));
  const largestValue = values.length ? Math.max(...values) : 0;
  const yMax = Math.min(600, Math.max(220, Math.ceil((largestValue + 25) / 50) * 50));
  const yTicks = [];
  for (let value = 40; value <= yMax; value += 50) {
    yTicks.push(value);
  }

  return (
    <section className="panel trend-panel" aria-labelledby="trend-title">
      <header className="section-heading">
        <div>
          <span className="eyebrow">
            <IconChart size={15} />
            Month to date
          </span>
          <h2 id="trend-title">Your daily average</h2>
          <p>{report?.label || 'Select a date to see your trend.'}</p>
        </div>
        <span className="chart-legend">
          <i aria-hidden="true" />
          Daily average
        </span>
      </header>

      {loading && !report ? (
        <div className="chart-skeleton" aria-label="Loading chart" />
      ) : trend.length === 0 ? (
        <div className="chart-empty">
          <span className="chart-empty__icon">
            <IconLeaf size={26} />
          </span>
          <div>
            <strong>Your trend starts with the first reading.</strong>
            <p>Add a reading and this month’s line will begin to take shape.</p>
          </div>
        </div>
      ) : (
        <>
          <p className="sr-only">
            Line chart of daily average glucose from {report.range.start} to {report.range.end}.
          </p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={286}>
              <LineChart data={trend} margin={{ top: 18, right: 20, left: -8, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#e6e1d5" strokeDasharray="3 5" />
                <ReferenceArea
                  y1={70}
                  y2={Math.min(180, yMax)}
                  fill="#dcece3"
                  fillOpacity={0.62}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDayNumber}
                  tick={{ fill: '#74807b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={20}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis
                  domain={[40, yMax]}
                  ticks={yTicks}
                  tick={{ fill: '#74807b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#b7c8c0' }} />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#0e6656"
                  strokeWidth={3}
                  dot={trend.length <= 10 ? { r: 3.5, fill: '#fbf8ef', strokeWidth: 2.5 } : false}
                  activeDot={{ r: 5, fill: '#e87253', stroke: '#fbf8ef', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-note">
            The shaded band marks 70–180 mg/dL, a common reference range. Always
            follow the target range your clinician gives you.
          </p>
        </>
      )}
    </section>
  );
}
