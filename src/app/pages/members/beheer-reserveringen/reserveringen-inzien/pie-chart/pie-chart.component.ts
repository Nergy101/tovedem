import { CommonModule } from '@angular/common';
import { Component, Input, computed, model } from '@angular/core';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive, NgApexchartsModule } from 'ng-apexcharts';

export interface ChartOptions {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  dataLabels: any;
};

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss'
})
export class PieChartComponent {
  series = model.required<number[]>();
  labels = model.required<string[]>();

  chartOptions = computed(() => {
    return {
      series: this.series(),
      chart: {
        width: 380,
        type: "pie"
      },
      labels: this.labels(),
      dataLabels: {
        enabled: true,
        formatter: function (val: any, opts: any) {
          // Display the absolute value
          return opts.w.config.series[opts.seriesIndex];
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    } as Partial<ChartOptions>
  })
}
