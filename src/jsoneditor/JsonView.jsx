import { Autocomplete, TextField, MenuItem,Select,Button } from '@mui/material'
import {transLangKey} from '../Chart/chartOpt'
import React, { useState } from 'react'
import {
  DataType,
  getKeyList,
  getPlaceholder,
  getQuoteAddress,
  getTypeString,
  typeMap,
} from './common'
import AddItem from './AddItem'
import { ConfigContext } from './jsoneditorstore'
import ArrayView from './ArrayView'
import ToolsView from './Tools'
import CollapsePart from './Collapse'

// export type JsonViewProps = {
//   setEditObject: any
//   editObject: Record<string, any>
//   optionsMap?: Record<
//     string,
//     Array<{
//       value: string
//       label?: string
//     }>
//   >
// }

function JsonView(props) {
  const { editObjectMeta,editObject, setEditObject, optionsMap } = props
  const [allowMap, setAllowMap] = useState({})

  const syncData = (data) => {
    setEditObject({ ...data })
  }

  const onClickDelete = (key, sourceData) => {
    if (Array.isArray(sourceData)) {
      sourceData.splice(+key, 1)
    } else {
      Reflect.deleteProperty(sourceData, key)
    }
    syncData(editObject)
  }

  const onChangeType = (type, uniqueKey) => {
    const newEditObject = getQuoteAddress(
      typeMap[type],
      getKeyList(uniqueKey),
      editObject
    )
    syncData(newEditObject)
  }

  /** 키를 바꿀일은 없다. 
  const onChangeKey = (event,currentKey,uniqueKey,source) => {
    const newValue= {}
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (key === currentKey) {
          newValue[event.target.value] = source[key]
        } else {
          newValue[key] = source[key]
        }
      }
    }

    const indexKeys = getKeyList(uniqueKey)
    const ROOT_LEVEL = 1
    if (indexKeys.length === ROOT_LEVEL) {
      syncData(newValue)
    } else {
      // remove last key equals set parent value
      indexKeys.pop()
      const newTotalData = getQuoteAddress(newValue, indexKeys, editObject)
      syncData(newTotalData)
    }
  }
  */

  const onChangeValue = (value,key,source) => {
    source[key] = value
    syncData(editObject)
  }

  const getValue = (fieldValue,fieldKey,sourceData,deepLevel,parentUniqueKey) => {
    const thatType = getTypeString(fieldValue)
    switch (thatType) {
      case DataType.ARRAY:
        return (
          <ArrayView
            fieldValue={fieldValue}
            fieldKey={fieldKey}
            sourceData={sourceData}
            deepLevel={deepLevel}
            parentUniqueKey={parentUniqueKey}
            getValue={getValue}
          />
        )
      case DataType.OBJECT:
        return (
          <span>
            {renderJsonConfig(fieldValue, deepLevel + 1, parentUniqueKey)}
          </span>
        )
      case DataType.STRING:
        const currentOptions = optionsMap?.[fieldKey] ?? []
        if(currentOptions.length > 0) {
          return (
            <Autocomplete
              style={{ width: 140 }}
              size="small"
              options={currentOptions}
              getOptionLabel={(option) => `${option.label ? transLangKey(option.label) : ''}`}
              value={(currentOptions && fieldValue) ? currentOptions.find((v) => v.value === fieldValue) : ''}
              onChange={(event, newValue) => {
                const value = newValue ? newValue.value : '';
                onChangeValue(value,fieldKey, sourceData)
              }}
              renderInput={(params) =>
                <TextField {...params} size="small" />
              }
            />
          )
        }
        else {
          return (<TextField
            size="small"
            style={{ width: '140px' }}
            value={fieldValue}
            onChange={event => {
              onChangeValue(event.target.value, fieldKey, sourceData)
            }}
          />
          )
        }
      case DataType.NUMBER:
        return (
          <TextField
            type="number"
            inputProps={{inputMode:'numeric',
                      // pattern: '[0-9]*'
            }}
            size="small"
            style={{ width: '140px' }}
            value={fieldValue}
            onChange={event => {
              onChangeValue(Number(event.target.value), fieldKey, sourceData)
            }}
          />
        )
      case DataType.BOOLEAN:
        return (
          <Select
            size="small"
            style={{ width: '140px' }}
            value={Boolean(fieldValue)}
            onChange={(event) => {
              onChangeValue(event.target.value, fieldKey, sourceData)
            }}
          >
            <MenuItem value={true} label="true">
              true
            </MenuItem>
            <MenuItem value={false} label="false">
              false
            </MenuItem>
          </Select>
        )
    }
  }
  const onChangeAllow = (uniqueKey) => {
    allowMap[uniqueKey] = !allowMap[uniqueKey]
    setAllowMap({ ...allowMap })
  }
  const defaultLevel = 1
  
  const renderJsonConfig = (
    sourceData,
    deepLevel = defaultLevel,
    parentUniqueKey = `${deepLevel}`
  ) => {
    const keyList = Object.keys(sourceData)
    if (!keyList.length) {
      return (
        <div style={{ marginLeft: '20px' }}>
          <AddItem
            uniqueKey={'defaultKay'}
            deepLevel={deepLevel}
            sourceData={sourceData}
          />
        </div>
      )
    }

    return (
      <div className="objectContent" style={{ width: props.width ?? 500,marginLeft: defaultLevel === deepLevel ? '0' : '20px' }}>
        <div style={{ marginTop: '10px' }}>
          {keyList.map((fieldKey, index) => {
            const uniqueKey = `${parentUniqueKey}-${index}`
            const fieldValue = sourceData[fieldKey]
            return (
              <div key={uniqueKey} className="indexLine">
                <CollapsePart uniqueKey={uniqueKey} fieldValue={fieldValue} />
                <span className="jsonKey">
                  {/* <TextField
                    size="small"
                    style={{ width: '100px' }}
                    placeholder={fieldKey}
                    value={fieldKey}
                    onChange={event =>
                      onChangeKey(event, fieldKey, uniqueKey, sourceData)
                    }
                    InputProps={{
                      readOnly: true,
                    }}
                  /> */}
                  <Button 
                    size="small"
                    style={{ width: '140px' }}  
                  >
                  {fieldKey}
                  </Button>
                </span>
                <b>{getPlaceholder(fieldValue)}</b>
                {!allowMap[uniqueKey] && (
                  <span className="jsonValue">
                    {getValue(
                      fieldValue,
                      fieldKey,
                      sourceData,
                      deepLevel,
                      uniqueKey
                    )}
                  </span>
                )}
                {
                props.editDoc ?
                      (<span className="toolsView">
                          <ToolsView
                            uniqueKey={uniqueKey}
                            fieldValue={fieldValue}
                            fieldKey={fieldKey}
                            sourceData={sourceData}
                          />
                      </span>) : null
                }
              </div>
            )
          })}
        </div>
        {
          props.editDoc ? (<div>
            <AddItem
              key={parentUniqueKey}
              uniqueKey={parentUniqueKey}
              deepLevel={deepLevel}
              sourceData={sourceData}
            />
          </div>) : null
        }
        
      </div>
    )
  }

  return (
    <ConfigContext.Provider
      value={{
        editObject,
        setEditObject,
        optionsMap,
        onChangeType,
        onClickDelete,
        onChangeAllow,
        allowMap,
      }}
    >
      {renderJsonConfig(editObject)}
    </ConfigContext.Provider>
  )
}

export default JsonView