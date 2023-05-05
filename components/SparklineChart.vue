<script setup lang="ts">
import * as d3 from 'd3'

const props = withDefaults(defineProps<{
  sparklineData: number[]
  lineColor?: string
}>(), {
  sparklineData: () => [],
  lineColor: '#16A34A',
})

const wrapperRef = ref<HTMLElement | null>(null)

const dimensions = {
  width: 100,
  height: 40,
  marginTop: 4,
}

const xAccessor = (d: any, i: number) => i
const yAccessor = (d: any) => d

function draw() {
  const data = normalizeData(props.sparklineData)
  const wrapper = d3.select(wrapperRef.value)

  const svg = wrapper
    .select('[data-chart]')
    .append('svg')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height)
    .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)

  const xDomain = [0, data.length - 1]
  const yDomain = [0, d3.max(data, yAccessor)] as any

  const xScale = d3.scaleLinear()
    .domain(xDomain)
    .range([0, dimensions.width])

  const yScale = d3.scaleLinear()
    .domain(yDomain)
    .range([dimensions.height - 2, dimensions.marginTop])

  const areaGenerator = d3.area()
    .x((d, i) => xScale(xAccessor(d, i)))
    .y1(d => yScale(yAccessor(d)))
    .y0(dimensions.height)
    .curve(d3.curveBumpX) as any

  svg
    .append('path')
    .datum(data)
    .attr('d', areaGenerator)
    .attr('fill', 'transparent')

  const lineGenerator = d3.line()
    .x((d, i) => xScale(xAccessor(d, i)))
    .y(d => yScale(yAccessor(d)))
    .curve(d3.curveBumpX) as any

  svg
    .append('path')
    .datum(data)
    .attr('d', lineGenerator)
    .attr('stroke', props.lineColor)
    .attr('stroke-width', 1.2)
    .attr('fill', 'none')
}

function normalizeData(data: number[], minRange = 0, maxRange = 100) {
  const minValue = Math.min(...data)
  const maxValue = Math.max(...data)
  const range = maxValue - minValue

  return data.map((value) => {
    return ((value - minValue) / range) * (maxRange - minRange) + minRange
  })
}

onMounted(() => {
  draw()
})
</script>

<template>
  <div ref="wrapperRef" class="chart-wrapper">
    <figure data-chart />
  </div>
</template>

<style scoped>
.chart-wrapper figure {
 display: flex;
 flex: 0 1 22.3rem;
 aspect-ratio: 6 / 2;
}

.chart-wrapper :deep(svg) {
 width: 100%;
 height: auto;
}
</style>
