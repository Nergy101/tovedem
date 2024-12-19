import { CommonModule } from '@angular/common';
import { Component, ViewChild, computed, effect, model } from '@angular/core';
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexDataLabels,
  ChartComponent,
  NgApexchartsModule,
} from 'ng-apexcharts';

export interface ChartOptions {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: string[];
  dataLabels: ApexDataLabels;
}

@Component({
  selector: 'app-pie-chart',
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss',
})
export class PieChartComponent {
  @ViewChild(ChartComponent) chart: ChartComponent | undefined;

  series = model.required<number[]>();
  labels = model.required<string[]>();

  constructor() {
    effect(() => {
      const newSeries = this.series();
      this.chart?.updateSeries(newSeries);
    });
  }

  chartOptions = computed(() => {
    return {
      autoUpdateSeries: false,
      series: [],
      chart: {
        width: 380,
        type: 'pie',
        animations: {
          enabled: true,
        },
      },
      labels: this.labels(),
      dataLabels: {
        enabled: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: function (_val: number, opts: any) {
          // Display the absolute value
          return opts.w.config.series[opts.seriesIndex];
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    } as Partial<ChartOptions>;
  });
}
