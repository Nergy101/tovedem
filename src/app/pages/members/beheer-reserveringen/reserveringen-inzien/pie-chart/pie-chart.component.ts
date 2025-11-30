
import {
  AfterContentChecked,
  Component,
  ViewChild,
  computed,
  effect,
  model,
} from '@angular/core';
import {
  ApexChart,
  ApexDataLabels,
  ApexNonAxisChartSeries,
  ApexResponsive,
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
  imports: [NgApexchartsModule],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss',
})
export class PieChartComponent implements AfterContentChecked {
  @ViewChild(ChartComponent) chart: ChartComponent | undefined;

  series = model.required<number[]>();
  labels = model.required<string[]>();
  totalUsed = model<number>();
  totalAvailable = model<number>();

  colors = ['#01E396', '#008FFB', '#FEB019', '#D3D3D3'];

  legend: ApexLegend = {
    show: true,
    position: 'bottom',
    labels: {
      colors: this.colors,
    },
  };

  constructor() {
    effect(() => {
      const newSeries = this.series();
      this.chart?.updateSeries(newSeries);
    });
  }

  ngAfterContentChecked(): void {
    this.chart?.updateSeries(this.series());
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
