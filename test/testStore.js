import React from 'react';
import { create, } from 'zustand';
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import produce from 'immer';

let t3smartScmMenuStore = (set, get, api) => ({
    views:[],
    initView: ()=> _initView(get(),set),
    tabContentData:[],
    addTabContentData:(path)=> _addTabContentData(get(),set, path),
})

t3smartScmMenuStore = subscribeWithSelector(t3smartScmMenuStore)
t3smartScmMenuStore = persist(t3smartScmMenuStore, {
  name: "T3SmartSCMMenus", // name of item in the storage (must be unique)
  getStorage: () => localStorage, // (optional) by default the 'sessionStorage' is used
  partialize: (state) => ({ menus: state.menus })
}
) //persist

export const useViewStore = create(t3smartScmMenuStore)

function _initView(state, set) {
    const views = state.views;
    views.push({
        path:'/',
        component: React.lazy(()=> import('./RawAgGridTest').catch(err=>{console.error(err)})),
        name:'AGGrid Test'
      })
      views.push({
        path:'/aggrid',
        component: React.lazy(()=> import('./RawAgGridTest2').catch(err=>{console.error(err)})),
        name:'ag-grid'
      })
      views.push({
        path:'/editor',
        component: React.lazy(()=> import('./EditorTest').catch(err=>{console.error(err)})),
        name:'editor'
      })
      views.push({
        path:'/chart',
        component: React.lazy(()=> import('./ChartTest').catch(err=>{console.error(err)})),
        name:'chart'
      })

      set({views:[...views]})
}

function _addTabContentData(state, set, path) {
    const tabContentData = state.tabContentData;
    if(!tabContentData.includes(path)) {
        tabContentData.push(path)
        set({tabContentData:[...tabContentData]})
    }
}