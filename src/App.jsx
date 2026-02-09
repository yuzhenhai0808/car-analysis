import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import './App.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// 默认值
const DEFAULTS = {
  // 充电相关 - 用户输入花费和里程
  electricCost: 29,           // 充电花费 元
  electricDistance: 50,       // 充电后跑的里程 公里
  electricPricePerKwh: 2.1,   // 电价 元/度
  
  // 加油相关 - 用户输入花费和里程
  fuelCost: 100,              // 加油花费 元
  fuelDistance: 200,          // 加油后跑的里程 公里
  fuelPricePerLiter: 7.0,     // 油价 元/升
}

function App() {
  // 用户输入参数 - 充电
  const [electricCost, setElectricCost] = useState(DEFAULTS.electricCost)
  const [electricDistance, setElectricDistance] = useState(DEFAULTS.electricDistance)
  const [electricPricePerKwh, setElectricPricePerKwh] = useState(DEFAULTS.electricPricePerKwh)
  
  // 用户输入参数 - 加油
  const [fuelCost, setFuelCost] = useState(DEFAULTS.fuelCost)
  const [fuelDistance, setFuelDistance] = useState(DEFAULTS.fuelDistance)
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(DEFAULTS.fuelPricePerLiter)

  // 计算每公里成本和百公里消耗
  const costs = useMemo(() => {
    // 每公里成本 = 总花费 / 里程
    const electricCostPerKm = electricDistance > 0 ? electricCost / electricDistance : 0
    const fuelCostPerKm = fuelDistance > 0 ? fuelCost / fuelDistance : 0
    
    // 反算百公里电耗/油耗
    // 百公里电费 = 每公里电费 * 100
    const electricCostPer100km = electricCostPerKm * 100
    const fuelCostPer100km = fuelCostPerKm * 100
    
    // 百公里电耗(度) = 百公里电费 / 电价
    const electricPer100km = electricPricePerKwh > 0 ? electricCostPer100km / electricPricePerKwh : 0
    // 百公里油耗(升) = 百公里油费 / 油价
    const fuelPer100km = fuelPricePerLiter > 0 ? fuelCostPer100km / fuelPricePerLiter : 0
    
    const diff = electricCostPerKm - fuelCostPerKm
    
    // 临界电价：使充电成本等于加油成本时的电价
    // 当 电价 * 百公里电耗 / 100 = 加油成本每公里
    // 电价 = 加油成本每公里 * 100 / 百公里电耗
    const criticalElectricPrice = electricPer100km > 0 ? (fuelCostPerKm * 100) / electricPer100km : 0
    
    return {
      electricCostPerKm,
      fuelCostPerKm,
      electricCostPer100km,
      fuelCostPer100km,
      electricPer100km,
      fuelPer100km,
      diff,
      criticalElectricPrice
    }
  }, [electricCost, electricDistance, electricPricePerKwh, fuelCost, fuelDistance, fuelPricePerLiter])

  // 决策建议
  const decision = useMemo(() => {
    const { diff, criticalElectricPrice } = costs
    const saving = Math.abs(diff)
    const annualKm = 15000
    const annualSaving = saving * annualKm

    if (diff > 0.01) {
      return {
        type: 'fuel',
        title: '⛽ 当前建议: 加油更划算',
        className: 'warning',
        priceRoom: `电价需降至 ${criticalElectricPrice.toFixed(2)} 元/度以下充电才划算`,
        saving,
        annualSaving
      }
    } else if (diff < -0.01) {
      return {
        type: 'electric',
        title: '⚡ 当前建议: 充电更划算',
        className: '',
        priceRoom: `电价可上涨至 ${criticalElectricPrice.toFixed(2)} 元/度仍然划算`,
        saving,
        annualSaving
      }
    } else {
      return {
        type: 'equal',
        title: '⚖️ 当前建议: 成本基本持平',
        className: 'equal',
        priceRoom: `临界电价: ${criticalElectricPrice.toFixed(2)} 元/度`,
        saving,
        annualSaving
      }
    }
  }, [costs])

  // 图表配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e8e8e8' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  }

  // 成本对比图数据 - 电价变化
  const costChartData = useMemo(() => {
    const labels = []
    const electricCosts = []
    const fuelCosts = []
    
    for (let p = 0.5; p <= 5; p += 0.1) {
      labels.push(p.toFixed(1))
      // 用新电价计算每公里成本
      const newElectricCostPerKm = costs.electricPer100km > 0 
        ? (p * costs.electricPer100km) / 100 
        : 0
      electricCosts.push(newElectricCostPerKm)
      fuelCosts.push(costs.fuelCostPerKm)
    }
    
    return {
      labels,
      datasets: [
        {
          label: '充电成本 (元/公里)',
          data: electricCosts,
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: '加油成本 (元/公里)',
          data: fuelCosts,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249,115,22,0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    }
  }, [costs])

  // 临界电价图数据 - 油价变化
  const criticalChartData = useMemo(() => {
    const labels = []
    const criticalPrices = []
    
    for (let f = 5; f <= 12; f += 0.2) {
      labels.push(f.toFixed(1))
      // 新油价下的每公里成本
      const newFuelCostPerKm = costs.fuelPer100km > 0 
        ? (f * costs.fuelPer100km) / 100 
        : 0
      // 临界电价
      const critical = costs.electricPer100km > 0 
        ? (newFuelCostPerKm * 100) / costs.electricPer100km 
        : 0
      criticalPrices.push(critical)
    }
    
    return {
      labels,
      datasets: [{
        label: '临界电价 (元/度)',
        data: criticalPrices,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.2)',
        fill: true,
        tension: 0.4
      }]
    }
  }, [costs])

  // 场景对比图数据
  const scenarioChartData = useMemo(() => {
    const annualKm = 15000
    const scenarios = [
      { label: '当前价格', elecMult: 1, fuelMult: 1 },
      { label: '电费+50%', elecMult: 1.5, fuelMult: 1 },
      { label: '电费+100%', elecMult: 2, fuelMult: 1 },
      { label: '油价+30%', elecMult: 1, fuelMult: 1.3 },
      { label: '油价+50%', elecMult: 1, fuelMult: 1.5 }
    ]
    
    return {
      labels: scenarios.map(s => s.label),
      datasets: [
        {
          label: '纯充电',
          data: scenarios.map(s => costs.electricCostPerKm * s.elecMult * annualKm),
          backgroundColor: '#00d4ff',
          borderRadius: 8
        },
        {
          label: '纯加油',
          data: scenarios.map(s => costs.fuelCostPerKm * s.fuelMult * annualKm),
          backgroundColor: '#f97316',
          borderRadius: 8
        }
      ]
    }
  }, [costs])

  // 成本比率图数据
  const ratioChartData = useMemo(() => {
    const labels = []
    const ratios = []
    
    for (let p = 0.5; p <= 5; p += 0.1) {
      labels.push(p.toFixed(1))
      const newElectricCostPerKm = costs.electricPer100km > 0 
        ? (p * costs.electricPer100km) / 100 
        : 0
      const ratio = costs.fuelCostPerKm > 0 
        ? newElectricCostPerKm / costs.fuelCostPerKm 
        : 0
      ratios.push(ratio)
    }
    
    return {
      labels,
      datasets: [{
        label: '成本比率 (充电/加油)',
        data: ratios,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.2)',
        fill: true,
        tension: 0.4
      }]
    }
  }, [costs])

  // 敏感性分析表数据
  const sensitivityData = useMemo(() => {
    const elecCostVariations = [-0.40, -0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60]
    const fuelCostVariations = [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30, 0.40, 0.50]
    
    return {
      elecVariations: elecCostVariations,
      fuelVariations: fuelCostVariations,
      currentElecCost: costs.electricCostPerKm,
      currentFuelCost: costs.fuelCostPerKm
    }
  }, [costs])

  const getCellData = (ev, fv) => {
    const eCost = sensitivityData.currentElecCost * (1 + ev)
    const fCost = sensitivityData.currentFuelCost * (1 + fv)
    const diff = eCost - fCost
    const diffPercent = Math.max(eCost, fCost) > 0 
      ? Math.abs(diff) / Math.max(eCost, fCost) * 100 
      : 0
    const isCurrent = (ev === 0 && fv === 0)
    
    let cellClass = ''
    let content = ''
    let icon = ''
    
    if (diffPercent < 1) {
      cellClass = 'equal'
      icon = '⚖️'
      content = `持平`
    } else if (diff < 0) {
      cellClass = 'electric-better'
      icon = '⚡'
      content = `充电`
    } else {
      cellClass = 'fuel-better'
      icon = '⛽'
      content = `加油`
    }
    
    if (isCurrent) {
      cellClass += ' current-cell'
      icon = '★'
      content = '当前'
    }
    
    return { cellClass, icon, content, diff: Math.abs(diff) }
  }

  return (
    <div className="container">
      <header>
        <h1>🚗 混动车能源成本分析看板</h1>
        <p className="subtitle">智能分析加油与充电的最优选择 | 根据您的实际花费计算</p>
      </header>

      {/* 用户输入面板 */}
      <div className="input-panel">
        <h2>📝 请输入您的实际花费</h2>
        <p className="input-hint">填写您每次充电/加油的花费和跑的里程，系统会自动计算每公里成本</p>
        
        <div className="input-grid">
          <div className="input-card electric">
            <h3>⚡ 充电花费</h3>
            <div className="input-row">
              <div className="input-group">
                <label>充电花费</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={electricCost}
                    onChange={(e) => setElectricCost(Number(e.target.value) || 0)}
                    step="1"
                    min="0"
                  />
                  <span className="unit">元</span>
                </div>
              </div>
              <div className="input-group">
                <label>跑了多少公里</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={electricDistance}
                    onChange={(e) => setElectricDistance(Number(e.target.value) || 0)}
                    step="1"
                    min="0"
                  />
                  <span className="unit">公里</span>
                </div>
              </div>
            </div>
            <div className="input-group">
              <label>当前电价（用于计算临界值）</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={electricPricePerKwh}
                  onChange={(e) => setElectricPricePerKwh(Number(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                />
                <span className="unit">元/度</span>
              </div>
            </div>
            <div className="calculated-results">
              <div className="calculated">
                <span>每公里电费:</span>
                <strong className="electric-value">{costs.electricCostPerKm.toFixed(4)} 元</strong>
              </div>
              <div className="calculated">
                <span>百公里电费:</span>
                <strong className="electric-value">{costs.electricCostPer100km.toFixed(2)} 元</strong>
              </div>
              <div className="calculated">
                <span>百公里电耗:</span>
                <strong className="electric-value">{costs.electricPer100km.toFixed(2)} 度</strong>
              </div>
            </div>
          </div>

          <div className="input-card fuel">
            <h3>⛽ 加油花费</h3>
            <div className="input-row">
              <div className="input-group">
                <label>加油花费</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(Number(e.target.value) || 0)}
                    step="1"
                    min="0"
                  />
                  <span className="unit">元</span>
                </div>
              </div>
              <div className="input-group">
                <label>跑了多少公里</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={fuelDistance}
                    onChange={(e) => setFuelDistance(Number(e.target.value) || 0)}
                    step="1"
                    min="0"
                  />
                  <span className="unit">公里</span>
                </div>
              </div>
            </div>
            <div className="input-group">
              <label>当前油价（用于计算临界值）</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={fuelPricePerLiter}
                  onChange={(e) => setFuelPricePerLiter(Number(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                />
                <span className="unit">元/升</span>
              </div>
            </div>
            <div className="calculated-results">
              <div className="calculated">
                <span>每公里油费:</span>
                <strong className="fuel-value">{costs.fuelCostPerKm.toFixed(4)} 元</strong>
              </div>
              <div className="calculated">
                <span>百公里油费:</span>
                <strong className="fuel-value">{costs.fuelCostPer100km.toFixed(2)} 元</strong>
              </div>
              <div className="calculated">
                <span>百公里油耗:</span>
                <strong className="fuel-value">{costs.fuelPer100km.toFixed(2)} 升</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 参数面板 */}
      <div className="params-panel">
        <div className="param-card">
          <h3><span className="icon">⚡</span> 充电成本</h3>
          <div className="param-value electric">{costs.electricCostPerKm.toFixed(4)}</div>
          <div className="param-unit">元/公里</div>
        </div>

        <div className="param-card">
          <h3><span className="icon">⛽</span> 加油成本</h3>
          <div className="param-value fuel">{costs.fuelCostPerKm.toFixed(4)}</div>
          <div className="param-unit">元/公里</div>
        </div>

        <div className="param-card">
          <h3><span className="icon">📊</span> 成本差异</h3>
          <div className={`param-value ${costs.diff > 0.02 ? 'warning' : costs.diff < -0.02 ? 'saving' : 'neutral'}`}>
            {costs.diff >= 0 ? '+' : ''}{costs.diff.toFixed(4)}
          </div>
          <div className="param-unit">元/公里 (正=充电贵)</div>
        </div>

        <div className="param-card">
          <h3><span className="icon">🎯</span> 临界电价</h3>
          <div className="param-value saving">{costs.criticalElectricPrice.toFixed(2)}</div>
          <div className="param-unit">元/度 (超过此价加油更划算)</div>
        </div>
      </div>

      {/* 决策面板 */}
      <div className={`decision-panel ${decision.className}`}>
        <div className="decision-title">{decision.title}</div>
        <div className="decision-content">
          <div className="decision-item">
            <h4>每公里节省</h4>
            <p>{decision.saving.toFixed(4)} 元</p>
          </div>
          <div className="decision-item">
            <h4>年节省 (按1.5万公里)</h4>
            <p>{decision.annualSaving.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 元</p>
          </div>
          <div className="decision-item">
            <h4>电价临界点</h4>
            <p>{decision.priceRoom}</p>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>📈 电费变化对成本的影响</h3>
          <div className="chart-container">
            <Line data={costChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>📊 油价变化时的临界电价</h3>
          <div className="chart-container">
            <Line data={criticalChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>💵 不同场景年度成本对比 (1.5万公里)</h3>
          <div className="chart-container">
            <Bar data={scenarioChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>📉 成本比率变化趋势</h3>
          <div className="chart-container">
            <Line data={ratioChartData} options={chartOptions} />
          </div>
        </div>

        {/* 敏感性分析表 */}
        <div className="chart-card sensitivity-table-container">
          <h3>📋 敏感性分析表 - 动态成本对比矩阵</h3>
          <div className="table-info">
            以当前价格为中心 | 充电成本: {sensitivityData.currentElecCost.toFixed(4)} 元/km | 
            加油成本: {sensitivityData.currentFuelCost.toFixed(4)} 元/km
          </div>
          <div className="table-wrapper">
            <table className="sensitivity-table">
              <thead>
                <tr>
                  <th className="header-fuel">加油↓ \ 充电→</th>
                  {sensitivityData.elecVariations.map(v => (
                    <th key={v} className="header-electric">
                      {v === 0 ? '当前' : (v > 0 ? `+${(v*100).toFixed(0)}%` : `${(v*100).toFixed(0)}%`)}
                      <br />
                      <small>{(sensitivityData.currentElecCost * (1 + v)).toFixed(3)}元/km</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensitivityData.fuelVariations.map(fv => (
                  <tr key={fv}>
                    <td className="header-fuel">
                      <strong>{fv === 0 ? '当前' : (fv > 0 ? `+${(fv*100).toFixed(0)}%` : `${(fv*100).toFixed(0)}%`)}</strong>
                      <br />
                      <small>{(sensitivityData.currentFuelCost * (1 + fv)).toFixed(3)}元/km</small>
                    </td>
                    {sensitivityData.elecVariations.map(ev => {
                      const cell = getCellData(ev, fv)
                      return (
                        <td key={ev} className={cell.cellClass}>
                          {cell.icon} {cell.content}
                          <br />
                          <small>差{cell.diff.toFixed(4)}/km</small>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-legend">
            <div className="legend-item">
              <div className="legend-color electric-bg"></div>
              <span>⚡ 充电更划算</span>
            </div>
            <div className="legend-item">
              <div className="legend-color fuel-bg"></div>
              <span>⛽ 加油更划算</span>
            </div>
            <div className="legend-item">
              <div className="legend-color equal-bg"></div>
              <span>⚖️ 差异&lt;1%</span>
            </div>
            <div className="legend-item">
              <div className="legend-color current-bg"></div>
              <span>★ 当前位置</span>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <p>📊 数据根据您输入的实际花费计算 | 默认值: 充电{DEFAULTS.electricCost}元跑{DEFAULTS.electricDistance}公里, 加油{DEFAULTS.fuelCost}元跑{DEFAULTS.fuelDistance}公里</p>
      </footer>
    </div>
  )
}

export default App
