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
  electricPricePerKwh: 2.1,      // 电价 元/度
  fuelPricePerLiter: 7.0,        // 油价 元/升
  electricPer100km: 27.62,       // 百公里电耗 度 (默认基于: 50km用13.81度)
  fuelPer100km: 7.0,             // 百公里油耗 升
}

function App() {
  // 用户输入参数
  const [electricPrice, setElectricPrice] = useState(DEFAULTS.electricPricePerKwh)
  const [fuelPrice, setFuelPrice] = useState(DEFAULTS.fuelPricePerLiter)
  const [electricPer100km, setElectricPer100km] = useState(DEFAULTS.electricPer100km)
  const [fuelPer100km, setFuelPer100km] = useState(DEFAULTS.fuelPer100km)

  // 计算每公里成本
  const costs = useMemo(() => {
    const electricCostPerKm = (electricPrice * electricPer100km) / 100
    const fuelCostPerKm = (fuelPrice * fuelPer100km) / 100
    const diff = electricCostPerKm - fuelCostPerKm
    // 临界电价：使充电成本等于加油成本时的电价
    const criticalElectricPrice = (fuelCostPerKm * 100) / electricPer100km
    
    return {
      electricCostPerKm,
      fuelCostPerKm,
      diff,
      criticalElectricPrice,
      electricCostPer100km: electricPrice * electricPer100km,
      fuelCostPer100km: fuelPrice * fuelPer100km
    }
  }, [electricPrice, fuelPrice, electricPer100km, fuelPer100km])

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

  // 成本对比图数据
  const costChartData = useMemo(() => {
    const labels = []
    const electricCosts = []
    const fuelCosts = []
    
    for (let p = 0.5; p <= 5; p += 0.1) {
      labels.push(p.toFixed(1))
      electricCosts.push((p * electricPer100km) / 100)
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
  }, [electricPer100km, costs.fuelCostPerKm])

  // 临界电价图数据
  const criticalChartData = useMemo(() => {
    const labels = []
    const criticalPrices = []
    
    for (let f = 5; f <= 12; f += 0.2) {
      labels.push(f.toFixed(1))
      const fuelCostPerKm = (f * fuelPer100km) / 100
      criticalPrices.push((fuelCostPerKm * 100) / electricPer100km)
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
  }, [fuelPer100km, electricPer100km])

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
          data: scenarios.map(s => 
            ((electricPrice * s.elecMult * electricPer100km) / 100) * annualKm
          ),
          backgroundColor: '#00d4ff',
          borderRadius: 8
        },
        {
          label: '纯加油',
          data: scenarios.map(s => 
            ((fuelPrice * s.fuelMult * fuelPer100km) / 100) * annualKm
          ),
          backgroundColor: '#f97316',
          borderRadius: 8
        }
      ]
    }
  }, [electricPrice, fuelPrice, electricPer100km, fuelPer100km])

  // 成本比率图数据
  const ratioChartData = useMemo(() => {
    const labels = []
    const ratios = []
    
    for (let p = 0.5; p <= 5; p += 0.1) {
      labels.push(p.toFixed(1))
      const elecCost = (p * electricPer100km) / 100
      ratios.push(elecCost / costs.fuelCostPerKm)
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
  }, [electricPer100km, costs.fuelCostPerKm])

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
    const diffPercent = Math.abs(diff) / Math.max(eCost, fCost) * 100
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
        <p className="subtitle">智能分析加油与充电的最优选择 | 根据您的车辆实际油耗电耗计算</p>
      </header>

      {/* 用户输入面板 */}
      <div className="input-panel">
        <h2>📝 请输入您的车辆参数</h2>
        <div className="input-grid">
          <div className="input-card electric">
            <h3>⚡ 充电相关</h3>
            <div className="input-group">
              <label>百公里电耗</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={electricPer100km}
                  onChange={(e) => setElectricPer100km(Number(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                />
                <span className="unit">度/百公里</span>
              </div>
            </div>
            <div className="input-group">
              <label>电价</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={electricPrice}
                  onChange={(e) => setElectricPrice(Number(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                />
                <span className="unit">元/度</span>
              </div>
            </div>
            <div className="calculated">
              <span>百公里电费:</span>
              <strong className="electric-value">{costs.electricCostPer100km.toFixed(2)} 元</strong>
            </div>
          </div>

          <div className="input-card fuel">
            <h3>⛽ 加油相关</h3>
            <div className="input-group">
              <label>百公里油耗</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={fuelPer100km}
                  onChange={(e) => setFuelPer100km(Number(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                />
                <span className="unit">升/百公里</span>
              </div>
            </div>
            <div className="input-group">
              <label>油价</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                />
                <span className="unit">元/升</span>
              </div>
            </div>
            <div className="calculated">
              <span>百公里油费:</span>
              <strong className="fuel-value">{costs.fuelCostPer100km.toFixed(2)} 元</strong>
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
          <div className="slider-container">
            <label>电费价格: {electricPrice.toFixed(1)} 元/度</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={electricPrice}
              onChange={(e) => setElectricPrice(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="param-card">
          <h3><span className="icon">⛽</span> 加油成本</h3>
          <div className="param-value fuel">{costs.fuelCostPerKm.toFixed(4)}</div>
          <div className="param-unit">元/公里</div>
          <div className="slider-container">
            <label>油价: {fuelPrice.toFixed(1)} 元/升</label>
            <input
              type="range"
              min="5"
              max="12"
              step="0.1"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(Number(e.target.value))}
            />
          </div>
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
        <p>📊 数据根据您输入的车辆参数实时计算 | 默认值: 百公里电耗{DEFAULTS.electricPer100km}度, 百公里油耗{DEFAULTS.fuelPer100km}升</p>
      </footer>
    </div>
  )
}

export default App
