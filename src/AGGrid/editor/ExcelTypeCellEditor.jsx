import React, {forwardRef,useEffect,useImperativeHandle,useRef,useState,} from 'react';
import ReactDOM from 'react-dom/client';

const KEY_BACKSPACE = 'Backspace';
const KEY_LEFT = 'ArrowLeft';
const KEY_UP = 'ArrowUp';
const KEY_RIGHT = 'ArrowRight';
const KEY_DOWN = 'ArrowDown';
const KEY_PAGE_UP = 'PageUp';
const KEY_PAGE_DOWN = 'PageDown';
const KEY_PAGE_HOME = 'Home';
const KEY_PAGE_END = 'End';

function isNavigationKey(event){
  return event.key === KEY_LEFT|| event.key === KEY_RIGHT
  || event.key === KEY_UP || event.key === KEY_DOWN;
}

function isBackspace(event) {
  return event.key === KEY_BACKSPACE;
}

function caretPosition(input) {
  var start = input.selectionStart,
      end = input.selectionEnd,
      diff = end - start;

  if (start >= 0 && start == end) {
      return start;
  }
}

//valueParser 등에 대한 로직을 확인해야 한다.
export const ExcelTypeCellEditor=forwardRef(({ context,...props}, ref) => {
  const [value, setValue] = useState(props.value);
  /**
   * 입력([I]nput)/편집([E]dit) 모드
   * 1. 입력모드는 값이 null이거나 비어있을때 
   * 2. 편집모드는 기존 값이 존재할때
     3. F2 키로 입력/편집 모드 토글 */
  const [editMode, setEditMode] = useState('I'); 
  const editRef= useRef(null);

  useImperativeHandle(ref, () => {
    return {
      getValue() {
        return value;
      },
    };
  });

  useEffect(() => {
    editRef.current.focus();
    if(value) {
      setEditMode('E') //편집모드로 설정
    }
    else {
      setEditMode('I')
    }
  }, []);
  
  const onKeyDownEventListener = (event) => {
    if (!event.key) {
      return;
    }
    if (isNavigationKey(event)) {
      
      //const valueLen = event.target.value !=undefined ? event.target.value.length : 0;
      //const caretPos=caretPosition(event.target)

      if(editMode =='I') {
        //navigate 처리
        var currentCell = props.api.getFocusedCell();
        var finalRowIndex = props.api.paginationGetRowCount()-1;
    
        props.api.stopEditing();

        if(event.key === KEY_LEFT) {
          props.api.tabToPreviousCell();
        }
        else if(event.key === KEY_RIGHT) {
          props.api.tabToNextCell();
        }
        else if(event.key === KEY_UP) {
          if (currentCell.rowIndex !=0) {
            props.api.clearFocusedCell();
            props.api.setFocusedCell(currentCell.rowIndex - 1, currentCell.column.colId)
          }
        }
        else if(event.key === KEY_DOWN) {
          if (currentCell.rowIndex != finalRowIndex) {
            props.api.clearFocusedCell();
            props.api.setFocusedCell(currentCell.rowIndex + 1, currentCell.column.colId)

            // props.api.startEditingCell({
            //   rowIndex: currentCell.rowIndex +1,
            //   colKey: currentCell.column.colId
            // });
          }
        }
        //event.stopPropagation();
      }
      return;
    }
  }
    
  const onChange=(e)=>{
    setValue(e.target.value)
  }

  return (
    <input ref={editRef} 
           value={value} 
           onChange={onChange}
           onKeyDown={onKeyDownEventListener}
      />
  )
});
