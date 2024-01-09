import { nodeResolve } from '@rollup/plugin-node-resolve';
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import external from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import url from "@rollup/plugin-url";
import json from "@rollup/plugin-json";
import postcss from "rollup-plugin-postcss";
import typescript from "rollup-plugin-typescript2";
import svgr from "@svgr/rollup";
import image from "@rollup/plugin-image";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import sourcemaps from "rollup-plugin-sourcemaps";

const extensions = [".js", ".jsx", ".ts", ".tsx"];

const { readdirSync, statSync } = require("fs");
const { join } = require("path");
 
const dirs = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory());
 
const modules = dirs("src");
 
const config = moduleDir => ({
 input: `src/${moduleDir}/index.js`,
 output: [
   {
     file: `dist/${moduleDir}/index.js`,
     format: "cjs",
     sourcemap: true
   },
   {
     file: `dist/${moduleDir}/index.es.js`,
     format: "es",
     sourcemap: true
   }
 ],
 external: ["react", "react-dom", "styled-components"],
 plugins: [
    nodeResolve(),
   external(),
   url(),
   json(),
   babel({
     exclude: "node_modules/**",
     presets: ["@babel/preset-react"],
     plugins: [
       "@babel/plugin-proposal-nullish-coalescing-operator"
     ],
     babelHelpers: "bundled"
   }),
   resolve({
     browser: true,
     extensions
   }),
   commonjs({ include: "node_modules/**" }),
   postcss({ plugins: [] }),
  //  typescript({ tsconfig: "./tsconfig.json", clean: true }),
   svgr(),
   image(),
   peerDepsExternal(),
   sourcemaps(),
  //  del({ targets: ["dist/*"] }),
 ]
});
 
export default commandLineArgs => {
 if (commandLineArgs.hasOwnProperty("package")){
   return [config(commandLineArgs.package)];
 }
 return modules.map(m => config(m));
};