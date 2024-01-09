import React, { useEffect, useRef, useState } from 'react';

export default props => {
  const [ascSort, setAscSort] = useState('inactive');
  const [descSort, setDescSort] = useState('inactive');
  const [noSort, setNoSort] = useState('inactive');
  const [checked, setChecked] = useState('');
  const refButton = useRef(null);

  const onMenuClicked = () => {
    props.showColumnMenu(refButton.current);
  }

  const onSortChanged = () => {
    setAscSort(props.column.isSortAscending() ? 'active' : 'inactive');
    setDescSort(props.column.isSortDescending() ? 'active' : 'inactive');
    setNoSort(!props.column.isSortAscending() && !props.column.isSortDescending() ? 'active' : 'inactive');
  }

  const onSortRequested = (order, event) => {
    props.setSort(order, event.shiftKey);
  }

  useEffect(() => {
    props.column.addEventListener('sortChanged', onSortChanged);
    onSortChanged()
  }, []);

  let menu = null;
  if (props.enableMenu) {
    menu =
      <span ref={refButton}
        className="ag-header-icon ag-header-cell-menu-button"
        onClick={() => onMenuClicked()}>
        <span className="ag-icon ag-icon-menu" unselectable="on" role="presentation"></span>
      </span>;
  }

  let sort = null;
  if (props.enableSorting) {
    sort =
      <div style={{ display: "inline-block" }}>
        <div onClick={event => onSortRequested('asc', event)} onTouchEnd={event => onSortRequested('asc', event)}
          className={`customSortDownLabel ${ascSort}`}>
          <i className="fa fa-long-arrow-alt-down"></i>
        </div>
        <div onClick={event => onSortRequested('desc', event)} onTouchEnd={event => onSortRequested('desc', event)}
          className={`customSortUpLabel ${descSort}`}>
          <i className="fa fa-long-arrow-alt-up"></i>
        </div>
        <div onClick={event => onSortRequested('', event)} onTouchEnd={event => onSortRequested('', event)}
          className={`customSortRemoveLabel ${noSort}`}>
          <i className="fa fa-times"></i>
        </div>
      </div>;
  }
  const headerAllCheck = (event) => {
    props.api.forEachNode((node, inx) => {
      let value = !checked;
      props.context.setValue(node, event.target.name, value)
      setChecked(value)
    })
  }
  return (
    <div style={{ display: 'flex' }} className="ag-cell-label-container" role="ag-custom-header">
      {menu}
      <div className="ag-header-cell-label">
        {props.column.colDef.cellDataType === 'boolean' ?
          <div className="ag-header-select-all"><input name={props.column.colId} type='checkbox' onClick={headerAllCheck} /></div> : <></>
        }
        <span className="ag-header-cell-text">{props.displayName}</span>
      </div>
    </div>
  );
};