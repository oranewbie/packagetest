import React, {forwardRef,useEffect,useImperativeHandle,useRef,useState,} from 'react';
import ReactDOM from 'react-dom';
import { List, ListItemButton, TextField,ListItemText } from "@mui/material";

  
export const MultiColumnSelectCellEditor= forwardRef((props, ref) => {
      
  const [value, setValue] = useState(props.value);
  const [editing, setEditing] = useState(true);
  const refContainer = useRef(null);

  const popupStyle = {
    border: '1px solid',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    width:'200px',
    maxHeight:'200px',
  };

  let optData= props.context.internalGetCodeDefs(props)

  useEffect(() => {
    focus();
  }, []);
  
  useImperativeHandle(ref, () => {
    return {
      getValue() {
        return value;
      },
    };
  });

  useEffect(() => {
    if (!editing) {
      props.stopEditing();
    }
  }, [editing]);

  const focus = () => {
    window.setTimeout(() => {
      let container = ReactDOM.findDOMNode(refContainer.current);
      if (container) {
        container.focus();
      }
    });
  };
  
  const onChange=(value)=> {
    setValue(value);
    setEditing(false);
  }

  return (
    <div ref={refContainer} style={popupStyle} tabIndex={1} >
      <List style={{maxHeight: '200px', overflow: 'auto', paddingTop: '0px', paddingBottom: '0px'}}
            dense  component="div" role="list" >
        {
          optData ? optData.map( option => { 
            return (<ListItemButton key={option['value']} 
                              selected={option['value'] == value}
                              role="listitem"
                              onClick={() => onChange(option['value'])}>
                      <ListItemText primary={option['label']} />
                    </ListItemButton>
                    ) 
          }) : null
        }
        </List>
    </div>
  );
});
