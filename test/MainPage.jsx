import React,{useState, useEffect,Suspense} from 'react';
//import Editor from '../src/Editor/Editor';

import { useViewStore } from './testStore';
import { Link,useLocation } from "react-router-dom";
import { CacheSwitch, CacheRoute } from "react-router-cache-route";
import { Box } from '@mui/material';


function MainPage(props) {

  console.log('MainPage')
    const [views, tabContentData,addTabContentData]= useViewStore((state) => [state.views, 
        state.tabContentData,state.addTabContentData]);

    let location = useLocation();

    useEffect(() => {
        addTabContentData(location.pathname);
    }, [location, views]);

    return (
      <Box style={{ flex: 1, width: '100%', height: '100%', padding:'5px', display: 'flex', flexDirection: 'column'}} >
        <Box style={{display:'flex',alignItems:'center', width: '100%', height: '40px'}}>
          <nav>
          {
            views.map((route,idx)=> 
              <span key={route.path} style={{padding:'0px 4px', margin:'0px 4px',border:'1px solid',
                  background:tabContentData.includes(route.path) ? "#bbefa4" :'white'
                  }}>
                  <Link key={route.name} to={route.path}>{`${idx}: ${route.name}`}</Link>
              </span>)
          }
          </nav>
        </Box>     
        <Box id='ContentInnerContainer' style={{flex: 1, width: '100%', height: 'calc(100% - 40px)',display: 'flex', flexDirection: 'column', overflow: 'hidden' }} >
            <CacheSwitch>
            {
                  views.map((route, idx) => {
                    if (tabContentData.findIndex(i => i == route.path) !== -1) {
                      return route.component && (
                        <CacheRoute
                          key={route.name}
                          when='always'
                          cacheKey={route.name}
                          path={route.path}
                          name={route.name}
                          exact={true}
                          render={props => (
                            <Suspense fallback={<div>Loading</div>}>
                              <route.component {...props} />
                            </Suspense>
                          )}
                          behavior={cached => cached ? { style: { display: "none" } } : { style: { height: "100%", width: '100%' } }}
                        />
                      )
                    }
                  })
              }
            </CacheSwitch>
        </Box>
      </Box>
    )
}

export default MainPage