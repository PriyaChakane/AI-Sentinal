'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, DollarSign, BarChart3, Percent } from 'lucide-react';

const businessImpactData = [
  { date: 'Week 1', revenue: 2400000, avgAccuracy: 94.2, decisions: 1200 },
  { date: 'Week 2', revenue: 2380000, avgAccuracy: 93.8, decisions: 1180 },
  { date: 'Week 3', revenue: 2350000, avgAccuracy: 93.1, decisions: 1150 },
  { date: 'Week 4', revenue: 2310000, avgAccuracy: 92.5, decisions: 1100 },
  { date: 'Week 5', revenue: 2270000, avgAccuracy: 91.9, decisions: 1050 },
  { date: 'Week 6', revenue: 2220000, avgAccuracy: 91.2, decisions: 980 },
];

const modelROI = [
  { model: 'Revenue Prediction', roi: 287, cost: 45000, benefit: 1280000 },
  { model: 'Churn Detection', roi: 340, cost: 38000, benefit: 1290000 },
  { model: 'Customer Segmentation', roi: 215, cost: 52000, benefit: 1120000 },
  { model: 'Recommendation Engine', roi: 420, cost: 35000, benefit: 1470000 },
];

const decisionImpact = [
  {
    decision: 'Loan Approval',
    totalDecisions: 12450,
    correctDecisions: 11680,
    accuracy: 93.8,
    falsePositivesCost: 45000,
    falseNegativesCost: 125000,
    netImpact: 'Positive',
  },
  {
    decision: 'Credit Limit Assignment',
    totalDecisions: 8920,
    correctDecisions: 8340,
    accuracy: 93.5,
    falsePositivesCost: 32000,
    falseNegativesCost: 95000,
    netImpact: 'Positive',
  },
  {
    decision: 'Risk Assessment',
    totalDecisions: 15680,
    correctDecisions: 14250,
    accuracy: 90.9,
    falsePositivesCost: 78000,
    falseNegativesCost: 210000,
    netImpact: 'Positive',
  },
];

const thresholdAnalysis = [
  { threshold: '0.30', precision: 92, recall: 75, f1: 82, revenue: 2100000 },
  { threshold: '0.40', precision: 94, recall: 80, f1: 86, revenue: 2250000 },
  { threshold: '0.50', precision: 96, recall: 85, f1: 90, revenue: 2380000 },
  { threshold: '0.60', precision: 98, recall: 78, f1: 87, revenue: 2200000 },
  { threshold: '0.70', precision: 99, recall: 65, f1: 79, revenue: 1850000 },
];

const metricBreakdown = [
  { label: 'Potential Revenue Loss from Drift', value: '$180,000', trend: 'up', color: 'text-red-400' },
  { label: 'Model Maintenance Cost', value: '$45,000', trend: 'stable', color: 'text-yellow-400' },
  { label: 'Estimated Retraining Benefit', value: '+$220,000', trend: 'up', color: 'text-green-400' },
  { label: 'Risk Mitigation Value', value: '+$340,000', trend: 'up', color: 'text-green-400' },
];

export function BusinessImpact() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Business Impact Estimation</h1>
        <p className="text-muted-foreground mt-2">ROI analysis, decision impact, and financial metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricBreakdown.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className={`text-2xl font-bold mt-2 ${metric.color}`}>{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Impact Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Revenue Impact vs Model Performance</CardTitle>
          <CardDescription>Correlation between model accuracy and business outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={businessImpactData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #6366f1' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#6366f1" name="Revenue ($)" />
              <Line yAxisId="right" type="monotone" dataKey="avgAccuracy" stroke="#a78bfa" strokeWidth={2} name="Accuracy (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Model ROI */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Model Return on Investment</CardTitle>
          <CardDescription>ROI comparison across deployed models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modelROI.map((item) => (
              <div key={item.model} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-foreground">{item.model}</h4>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{item.roi}%</p>
                    <p className="text-xs text-green-400">ROI</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Implementation Cost</p>
                    <p className="font-mono">${(item.cost / 1000).toFixed(0)}k</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Annual Benefit</p>
                    <p className="font-mono text-green-400">${(item.benefit / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Decision Impact Analysis */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Decision Impact Analysis</CardTitle>
          <CardDescription>Business value of model predictions by decision type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {decisionImpact.map((decision) => (
              <div
                key={decision.decision}
                className="p-4 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-foreground">{decision.decision}</h4>
                  <div className={`px-3 py-1 rounded text-xs font-medium ${
                    decision.netImpact === 'Positive'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {decision.netImpact}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Decisions</p>
                    <p className="font-mono font-bold">{decision.totalDecisions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className="font-mono font-bold text-primary">{decision.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">FP Cost</p>
                    <p className="font-mono font-bold text-red-400">${(decision.falsePositivesCost / 1000).toFixed(0)}k</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">FN Cost</p>
                    <p className="font-mono font-bold text-red-400">${(decision.falseNegativesCost / 1000).toFixed(0)}k</p>
                  </div>
                </div>
                <div className="w-full bg-background rounded h-2">
                  <div className="bg-primary rounded h-2" style={{ width: `${decision.accuracy}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threshold Optimization */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Threshold Optimization Analysis</CardTitle>
          <CardDescription>Impact of decision threshold changes on metrics and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={thresholdAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="threshold" stroke="rgba(255,255,255,0.5)" />
              <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #6366f1' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="precision" stroke="#6366f1" strokeWidth={2} name="Precision" />
              <Line yAxisId="left" type="monotone" dataKey="recall" stroke="#a78bfa" strokeWidth={2} name="Recall" />
              <Line yAxisId="left" type="monotone" dataKey="f1" stroke="#ec4899" strokeWidth={2} name="F1-Score" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle>Financial Impact Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <DollarSign className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Potential Annual Benefit</p>
                <p className="text-2xl font-bold text-green-400 mt-1">$4.2M</p>
              </div>
            </div>
            <div className="flex gap-3">
              <TrendingUp className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Risk Mitigation Value</p>
                <p className="text-2xl font-bold text-primary mt-1">$340K</p>
              </div>
            </div>
          </div>
          <div className="border-t border-primary/20 pt-4">
            <p className="text-sm text-muted-foreground mb-2">Recommendations to Maximize Impact:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Retrain models immediately to capture recent patterns and prevent further revenue loss</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Optimize decision thresholds using the analysis above to balance precision/recall</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Implement bias mitigation strategies to reduce unfair prediction costs</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
