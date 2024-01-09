import React, { useRef,useEffect,forwardRef,useState,useImperativeHandle } from 'react';
import { generateId, toNumberLocaleString } from '../../../utils/common';
import ChatBubbleTwoToneIcon from '@mui/icons-material/ChatBubbleTwoTone';
import MessageTwoToneIcon from '@mui/icons-material/MessageTwoTone';
import { Popover,Box } from '@mui/material';
/**
 * Entry 입력을 위한 CellRenderer
 */
export const EntryCellRenderer= forwardRef(({node,data,value, setValue,measureName,gridItem,...props}, ref) => {
    
    const[cmtBtnYn, setCmtBtnYn] = useState(false);
    const[comment, setComment] = useState(false);
    const [openPopover, setOpenPopover] = useState(false);
    //const [anchorEl, setAnchorEl] = React.useState(null);
    const openBtnRef = useRef(null);
    const id = useRef(null)
    if(!id.current) {
      id.current = generateId();
    }

    const colId = props.colDef.colId;
    let displayValue = data ? data[colId] : value
        

    useImperativeHandle(ref, () => {
      return {
        getValueToDisplay(params) {
          return data ? data[params.colDef.colId] : params.value
        },
      };
    });

    useEffect(()=>{
      if(!data)
        return;
      let val = data["CATEGORY"]
      if(measureName && measureName.includes(val)) {
          setCmtBtnYn(true)
      }
      let colName = props.colDef.field;
      colName = colName.replace('VALUE', 'COMMENT')
      setComment(data[colName])
  },[node])

    useEffect(()=>{
        if(!data)
          return;
        if(openPopover) {
          let val = data["CATEGORY"]
          if(measureName && measureName.includes(val)) {
              setCmtBtnYn(true)
          }
          let colName = props.colDef.field;
          colName = colName.replace('VALUE', 'COMMENT')
          setComment(data[colName])
        }
    },[openPopover])
    
    const handleClickAway = () => {
        setOpenPopover(false);
    };

    const closePopover = () => {
        setOpenPopover(false);
    }
    
    const onMessageClick=(event)=>{
      setOpenPopover((previousOpen) => !previousOpen);
    }
    
    const onChangeComment=(e) => {
        let colName = props.colDef.field;
        let comentColName = colName
        comentColName = comentColName.replace('VALUE', 'COMMENT')
        props.context.setValue(node,comentColName, e.target.value);
        setComment(e.target.value)
    }

    const getDisplayValue=()=> {
      if(gridItem && gridItem.numberFormat)
        return toNumberLocaleString(displayValue,gridItem.numberFormat)
      else
        return toNumberLocaleString(displayValue)
    }

    const getCommentComp=() =>{
        return (<div style={{display: 'flex'}}>
        {
          comment ? <MessageTwoToneIcon onClick={onMessageClick}  style={{color: 'red', width: '12px', height: '12px'}}></MessageTwoToneIcon>:
          <ChatBubbleTwoToneIcon onClick={onMessageClick} style={{width: '12px', height: '12px'}}></ChatBubbleTwoToneIcon>           
        }            
            <Popover id={id.current} open={openPopover} anchorEl={openBtnRef.current}
                    onClose={closePopover}
                    anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                    }}>
                        <Box style={{position:'relative'}}>
                            <textarea cols="30" rows="5" onChange={onChangeComment} value={comment || ''}></textarea>
                        </Box>
            </Popover>
        </div>)
    }
    
    return(
      data ? //group되어 있을때는 undefined
        <div ref={openBtnRef} style={{display:'flex', flexDirection:'row'}}>
          <span style={{width: 'calc(100%-15px)',display:'block', overflow:'hidden', textOverflow:'ellipsis',flex:1 }}>
            {getDisplayValue()}
          </span>
          {cmtBtnYn ? getCommentComp() : null}</div>
        :null
    )
  });
