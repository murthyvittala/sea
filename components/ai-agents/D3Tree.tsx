"use client";
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

type TreeNode = {
  name: string;
  value?: number;
  children?: TreeNode[];
};

export default function D3Tree({ data, width = 1000, height = 600 }: { data: any, width?: number, height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !ref.current) return;
    ref.current.innerHTML = "";

    const margin = { top: 40, right: 220, bottom: 40, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy<TreeNode>(data);
    // Reduce horizontal spacing to 80% of current
    const treeLayout = d3.tree<TreeNode>().size([innerHeight, innerWidth * 0.8]);
    treeLayout(root);

    const linkGenerator = d3
      .linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
      .x(d => d.y)
      .y(d => d.x);

    // Draw links
    svg
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 2)
      .attr("d", function(d) {
        return linkGenerator(d as d3.HierarchyPointLink<TreeNode>);
      });

    // Draw nodes
    const node = svg
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("r", 8)
      .attr("fill", d => d.children ? "#69b3a2" : "#fff")
      .attr("stroke", "#333")
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dy", function(d) {
        // Add 5px padding to depth 1 (second parent) labels
        return d.depth === 1 ? 18 : 3;
      })
      .attr("x", function(d) {
        // Center depth 1 (second parent) labels
        if (d.depth === 1) return 0;
        return d.children ? -14 : 14;
      })
      .attr("text-anchor", function(d) {
        // Center depth 1 (second parent) labels
        if (d.depth === 1) return "middle";
        return d.children ? "end" : "start";
      })
      .text(d => d.data.name)
      .style("font-size", "13px");

    // Tooltip
    const tooltip = d3.select(ref.current)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "rgba(255,255,255,0.95)")
      .style("border", "1px solid #ccc")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("font-size", "13px")
      .style("color", "#222")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
      .style("visibility", "hidden")
      .style("z-index", "10");

    node
      .on("mousemove", function (event, d) {
        tooltip
          .style("visibility", "visible")
          .html(`<strong>${d.data.name}</strong>${d.data.value !== undefined ? `<br/>Value: ${d.data.value}` : ""}`)
          .style("left", (event.offsetX + 16) + "px")
          .style("top", (event.offsetY - 10) + "px");
      })
      .on("mouseleave", function () {
        tooltip.style("visibility", "hidden");
      });
  }, [data, width, height]);

  return <div ref={ref} style={{ position: "relative" }} />;
}
