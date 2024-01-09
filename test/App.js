import React,{useState, useEffect,Suspense} from 'react';

import { useViewStore } from './testStore';
import { HashRouter} from "react-router-dom";
import MainPage from './MainPage'


let initApp = false;

function App() {

  console.log("App")
  const [initView]= useViewStore((state) => [state.initView]);
  
  if(initApp==false) {
    initView();
    initApp=true;
  }

    return (
      <div style={{width:'100%', height:'100%'}}>
        <HashRouter>
          <MainPage></MainPage>
        </HashRouter>
      </div>
    );
}

export default App;