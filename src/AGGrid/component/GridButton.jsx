import React, { useEffect, useRef, useState } from "react";
import { Button, IconButton, Tooltip } from "@mui/material";
import PropTypes from 'prop-types';
import {
  transLangKey, useViewStore, useContentStore, showMessage, getAppSettings, zAxios,
} from '@zionex/wingui-core/index';

export function GridAddRowButton(props) {
  let component = getAppSettings('component');
  const iconClasses = useIconStyles();
  const [gridObject, setGridObject] = useState(props.grid);

  useEffect(() => {
    if (props.grid) {
      setGridObject(props.grid);
    }
  }, [props.grid])

  function insertRow() {
    if (gridObject == null) {
      console.log('gridObject 가 없습니다.')
      return;
    }

    __insertRow(gridObject);
  }

  function __insertRow(gridObject) {
    const onBeforeAdd = props.onBeforeAdd || (() => { return true });
    const onGetData = props.onGetData || (() => { return {} });
    const onAfterAdd = props.onAfterAdd || (() => { return true });
    const result = onBeforeAdd(gridObject);

    if (!result)
      return;

    if (isPromise(result)) {
      result.then(function (response) {
        if (response == true) {
          _internalAdd(gridObject, onGetData, onAfterAdd);
        }
      }).catch(function (err) {
        console.log(err)
      })
    } else if (typeof result == 'function') {
      const testfunc = new Promise((resolve, reject) => {
        resolve(result());
      })

      testfunc.then(function (response) {
        if (response == true) {
          _internalAdd(gridObject, onGetData, onAfterAdd);
        }
      }).catch(function (err) {
        console.log(err)
      })
    } else if (typeof result == 'object') { //{result:false,"message":transLangKey('MSG_WARNING_SAVE_STATUS')}
      if (result.result) {
        _internalAdd(gridObject, onGetData, onAfterAdd);
      } else if (result.message) {
        showMessage(transLangKey('WARNING'), message);
        return;
      }
    } else {
      _internalAdd(gridObject, onGetData, onAfterAdd);
    }
  }

  function _internalAdd(gridObject, onGetData, onAfterAdd) {
    let data = onGetData(gridObject);

    if (data == undefined) {
      data = {}
    }
    gridObject.context.getColumnDefs().forEach(col => {
      if (col.cellDataType === 'boolean') {
        if (col.defaultValue !== undefined) {
          data[col.colId] = col.defaultValue
        } else {
          data[col.colId] = false
        }
      }
    })
    const res = gridObject.context.insertRowData(undefined, data);
    onAfterAdd(gridObject, res);
  }

  return (
    <>
      <Tooltip title={transLangKey("ADD")} placement='bottom' arrow>
        {component.button === 'icon' ?
          <IconButton className={iconClasses.gridIconButton} onClick={props.onClick ? props.onClick : insertRow}><Icon.Plus size={20} /></IconButton>
          : <Button variant="outlined" props={{ ...props }} onClick={props.onClick ? props.onClick : insertRow}>
            {transLangKey("ADD")}
          </Button>
        }
      </Tooltip>
    </>
  )
}

GridAddRowButton.propTypes = {
  grid: PropTypes.any,
  onBeforeAdd: PropTypes.func,
  onGetData: PropTypes.func,
  onAfterAdd: PropTypes.func,
  onClick: PropTypes.func,
};

GridAddRowButton.displayName = 'GridAddBtn';

export function GridDeleteRowButton(props) {
  const activeViewId = useContentStore.getState().activeViewId;
  let component = getAppSettings('component');
  const iconClasses = useIconStyles();
  const [gridObject, setGridObject] = useState(props.grid);
  const [getViewInfo] = useViewStore(state => [state.getViewInfo]);
  const permissions = getViewInfo(activeViewId, 'permissions');

  useEffect(() => {
    if (props.grid) {
      setGridObject(props.grid);
    }
  }, [props.grid]);

  function deleteRow() {
    if (!gridObject) {
      console.log('gridObject 가 없습니다.');
      return;
    }
    __deleteRow(gridObject)
  }

  function _internalDelete(gridObject, onDelete, onGetDeleteData, onAfterDelete, onErrorDelete) {
    let deleteRows = [];
    let newRows = [];
    let allDelRows = [];
    if (onGetDeleteData) {
      const deletingData = onGetDeleteData(gridObject); // {removeNew:[RowNode], remove:[RowNode]}
      newRows = deletingData.removeNew;
      deleteRows = deletingData.remove;
      allDelRows = allDelRows.concat(newRows);
      allDelRows = allDelRows.concat(deleteRows); // allDelRows = [RowNode]
    } else {
      let updRows = gridObject.context.getAllUpdatedRows();
      const selNodes = updRows.filter(row => row.checkSelect === true);
      selNodes.forEach((node) => {
        if (gridObject.context.isNewRow(node)) {
          newRows.push(node);
        } else {
          deleteRows.push(node)
        }
        allDelRows.push(node)
      });
    }
    if (allDelRows.length == 0) {
      showMessage(transLangKey('MSG_CONFIRM'), transLangKey('MSG_SELECT_DELETE'), { close: false });
    } else {
      showMessage(transLangKey('DELETE'), transLangKey('MSG_DELETE'), function (answer) {
        if (answer) {
          if (props.url) {
            let formData = new FormData();
            formData.append('changes', JSON.stringify(gridObject.context.getRowNodeData(deleteRows)));
            zAxios({
              method: 'post',
              url: props.url,
              headers: { 'content-type': 'multipart/form-data' },
              data: formData
            }).then(function (response) {
              if (response.status === HTTP_STATUS.SUCCESS) {
                onAfterDelete(gridObject, deleteRows, newRows);
              }
            }).catch(function (err) {
              onErrorDelete(gridObject, err, deleteRows, newRows);
            }).then(function (response) {
              gridObject.context.removeRows(allDelRows);
            })
          } else {
            let thenable = onDelete(gridObject, deleteRows, newRows);
            if (thenable && isPromise(thenable)) {
              thenable.then(function (response) {
                if (response.status === HTTP_STATUS.SUCCESS) {
                  onAfterDelete(gridObject, deleteRows, newRows);
                }
              }).catch(function (err) {
                onErrorDelete(gridObject, err, deleteRows, newRows);
              }).then(function (response) {
                gridObject.context.removeRows(allDelRows);
              })
            } else {
              onAfterDelete(gridObject, deleteRows, newRows);
            }
          }
        }
      });
    }
  }

  function __deleteRow(gridObject) {

    const onBeforeDelete = props.onBeforeDelete || (() => { return true });
    const onDelete = props.onDelete || (() => { return Promise.resolve(1) });
    const onGetDeleteData = props.onGetDeleteData;
    const onAfterDelete = props.onAfterDelete || (() => { return true });
    const onErrorDelete = props.onErrorDelete || ((gridObj, err) => { console.log(err) });

    const result = onBeforeDelete(gridObject);
    if (!result) {
      return;
    }
    if (isPromise(result)) {
      result.then(function (response) {
        if (response == true) {
          _internalDelete(gridObject, onDelete, onGetDeleteData, onAfterDelete, onErrorDelete);
        }
      })
        .catch(function (err) {
          console.log(err)
        })
    }
    else if (typeof result == 'function') {
      const testfunc = new Promise((resolve, reject) => {
        resolve(result());
      })

      testfunc.then(function (response) {
        if (response == true) {
          _internalDelete(gridObject, onDelete, onGetDeleteData, onAfterDelete, onErrorDelete);
        }
      })
        .catch(function (err) {
          console.log(err)
        })
    }
    else if (typeof result == 'object') { //{result:false,"message":transLangKey('MSG_WARNING_SAVE_STATUS')}
      if (result.result) {
        _internalDelete(gridObject, onDelete, onGetDeleteData, onAfterDelete, onErrorDelete);
      }
      else if (result.message) {
        showMessage(transLangKey('WARNING'), message);
        return;
      }
    }
    else {
      _internalDelete(gridObject, onDelete, onGetDeleteData, onAfterDelete, onErrorDelete);
    }
  }
  return (
    <>
      <Tooltip title={transLangKey("DELETE")} placement='bottom' arrow>
        {component.button === 'icon' ?
          <IconButton className={iconClasses.gridIconButton} disabled={permissions !== null ? !permissions.PERMISSION_TYPE_DELETE : false} onClick={props.onClick ? props.onClick : deleteRow}><Icon.Minus size={20} /></IconButton>
          : <Button variant="outlined" props={{ ...props }} disabled={permissions !== null ? !permissions.PERMISSION_TYPE_DELETE : false} onClick={props.onClick ? props.onClick : deleteRow}>
            {transLangKey("DELETE")}
          </Button>
        }
      </Tooltip>
    </>
  )
}

GridDeleteRowButton.propTypes = {
  grid: PropTypes.any,
  url: PropTypes.string,
  onBeforeDelete: PropTypes.func,
  onGetDeleteData: PropTypes.func,
  onDelete: PropTypes.func,
  onAfterDelete: PropTypes.func,
  onClick: PropTypes.func,
};

GridDeleteRowButton.displayName = 'GridDeleteRowButton';


export function GridSaveButton(props) {
  const activeViewId = useContentStore.getState().activeViewId
  let component = getAppSettings('component');
  const iconClasses = useIconStyles();
  const [gridObject, setGridObject] = useState(props.grid);

  const [getViewInfo] = useViewStore(state => [state.getViewInfo])
  const permissions = getViewInfo(activeViewId, 'permissions');

  useEffect(() => {
    if (props.grid) {
      setGridObject(props.grid);
    }
  }, [props.grid])

  function saveRows() {
    if (!gridObject)
      return;

    __saveRows(gridObject)
  }

  function _internalSave(gridObject, onSave, onAfterSave, onErrorSave) {
    const validationInfoArr = gridObject.context.validateCells();
    if (validationInfoArr && validationInfoArr.length > 0) {
      //아래 오류 내용을 확인해주세요.
      let contentBody = '<h6>' + transLangKey('MSG_VALIDATE_ERROR_SAVE_DATA') + '</h6><br/>';
      invalidCells.forEach(c => {
        contentBody += '<h6> [Row: ' + c.dataRow + ' Column: ' + gridView.getColumnProperty(c.column, 'header').text + '] : ' + transLangKey(c.message) + '</h6>'
      })
      showMessage(transLangKey('FP_VALIDATION_FAIL'), contentBody, { close: false });
      return;
    }

    showMessage(transLangKey('MSG_CONFIRM'), transLangKey('MSG_SAVE'), function (answer) {
      if (answer) {
        let changes = gridObject.context.getAllUpdatedRows();
        let changeRowData = [];

        changes.forEach(function (row) {
          let values = gridObject.context.getJsonRow(row);
          Object.keys(values).forEach(key => {
            if (values[key] && values[key] instanceof Date) {
              values[key] = values[key].format('yyyy-MM-ddTHH:mm:ss');
            }
          });
          changeRowData.push(values);
        });

        if (changeRowData.length === 0) {
          showMessage(transLangKey('MSG_CONFIRM'), transLangKey('MSG_5039'));
        } else {
          if (props.url) {
            let formData = new FormData();
            formData.append('changes', JSON.stringify(gridObject.context.getRowNodeData(changeRowData)));

            zAxios({
              method: 'post',
              headers: props.headers ?? { 'content-type': 'multipart/form-data' },
              url: props.url,
              data: formData
            })
              .then(function (response) {
                gridObject.context.commit();
                onAfterSave(gridObject, response, changeRowData);
              })
              .catch(function (err) {
                onErrorSave(gridObject, err);
              })
          } else {
            let thenable = onSave(gridObject, changeRowData);
            if (thenable && isPromise(thenable)) {
              thenable.then(function (response) {
                gridObject.context.commit();
                onAfterSave(gridObject, response, changeRowData);
              })
                .catch(function (err) {
                  onErrorSave(gridObject, err, changeRowData);
                })
            }
          }
        }
      }
    });
  }

  function __saveRows(gridObject) {

    const onBeforeSave = props.onBeforeSave || (() => { return true });
    const onSave = props.onSave || (() => { return Promise.resolve(1) });
    const onAfterSave = props.onAfterSave || (() => { return true });
    const onErrorSave = props.onErrorSave || ((gridObj, err) => { console.log(err) });

    const result = onBeforeSave(gridObject);
    if (!result) {
      return;
    }
    if (isPromise(result)) {
      result.then(function (response) {
        if (response == true) {
          _internalSave(gridObject, onSave, onAfterSave, onErrorSave);
        }
      })
        .catch(function (err) {
          console.log(err)
        })
    }
    else if (typeof result == 'function') {
      const testfunc = new Promise((resolve, reject) => {
        resolve(result());
      })

      testfunc.then(function (response) {
        if (response == true) {
          _internalSave(gridObject, onSave, onAfterSave, onErrorSave);
        }
      })
        .catch(function (err) {
          console.log(err)
        })
    }
    else if (typeof result == 'object') { //{result:false,"message":transLangKey('MSG_WARNING_SAVE_STATUS')}
      if (result.result) {
        _internalSave(gridObject, onSave, onAfterSave, onErrorSave);
      }
      else if (result.message) {
        showMessage(transLangKey('WARNING'), message);
        return;
      }
    }
    else {
      _internalSave(gridObject, onSave, onAfterSave, onErrorSave);
    }
  }

  return (
    <>
      <Tooltip title={transLangKey("SAVE")} placement='bottom' arrow>
        {component.button === 'icon' ?
          <IconButton className={iconClasses.gridIconButton} disabled={permissions !== null ? !permissions.PERMISSION_TYPE_UPDATE : false} onClick={props.onClick ? props.onClick : saveRows}><Icon.Save size={20} /></IconButton>
          : <Button variant="outlined" props={{ ...props }} disabled={permissions !== null ? !permissions.PERMISSION_TYPE_UPDATE : false} onClick={props.onClick ? props.onClick : saveRows}>{transLangKey("SAVE")}</Button>
        }
      </Tooltip>
    </>
  )
}

GridSaveButton.propTypes = {
  grid: PropTypes.any,
  url: PropTypes.string,
  onBeforeSave: PropTypes.func,
  onSave: PropTypes.func,
  onAfterSave: PropTypes.func,
  onErrorSave: PropTypes.func,
  onClick: PropTypes.func,
};

GridSaveButton.displayName = 'GridSaveButton';