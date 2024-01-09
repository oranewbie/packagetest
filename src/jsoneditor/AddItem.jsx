import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import {
  Autocomplete,
  Button,
  Box,
  TextField,
  Select,
  MenuItem ,
  Stack,
} from '@mui/material'
import _ from 'lodash'
import React from 'react'
import { useContext, useState } from 'react'
import { ConfigContext } from './jsoneditorstore'
import { DataType, typeMap } from './common'

// props: {
//   uniqueKey: string
//   sourceData: any
//   deepLevel: number
// }

const AddItem = (props) => {
  const { setEditObject, editObject, optionsMap } = useContext(ConfigContext)
  const { uniqueKey, sourceData } = props
  const isArray = Array.isArray(sourceData)
  const [templateData, setTemplateData] = useState({})
  const [showIncreaseMap, setShowIncreaseMap] = useState({})
  const onClickIncrease = (key, value) => {
    showIncreaseMap[key] = value
    templateData[key] = {}
    setTemplateData({
      ...templateData,
    })
    setShowIncreaseMap({
      ...showIncreaseMap,
    })
  }
  const changeInputKey = (uniqueKey, event) => {
    templateData[uniqueKey]['key'] = event.target.value
    setTemplateData({ ...templateData })
  }
  const changeInputValue = (uniqueKey, value) => {
    templateData[uniqueKey]['value'] = value
    setTemplateData({ ...templateData })
  }
  const onChangeTempType = (uniqueKey, type) => {
    templateData[uniqueKey]['type'] = type
    templateData[uniqueKey]['value'] = typeMap[type]
    setTemplateData({
      ...templateData,
    })
  }
  const onConfirmIncrease = (uniqueKey, sourceData) => {
    const { key: aKey, value } = _.cloneDeep(templateData[uniqueKey])
    if (isArray) {
      sourceData.push(value)
    } else {
      sourceData[aKey] = value
    }
    setEditObject({ ...editObject })
    onClickIncrease(uniqueKey, false)
  }

  const getTypeTemplate = (type) => {
    switch (type) {
      case DataType.STRING:
        const currentOptions = optionsMap?.[templateData[uniqueKey]?.['key']] ?? []

        if(currentOptions.length > 0) {
            return (
              <Autocomplete
                style={{ width: 100 }}
                size="small"
                options={currentOptions}
                getOptionLabel={(option) => `${option.label ? transLangKey(option.label) : ''}`}
                onChange={(event, newValue) => {
                  changeInputValue(uniqueKey,newValue ? newValue.value : '')
                }}
                renderInput={(params) =>
                    <TextField {...params} size="small" />
                }
              />
            )
         }
         else {
          <TextField            
            size="small"
            style={{ width: '140px' }}
            onChange={event => changeInputValue(uniqueKey, event.target.value)}
        />
         }
      case DataType.NUMBER:
        return (
          <TextField
            type="number"
            inputProps={{inputMode:'numeric',
                        pattern: '[0-9]*'
            }}
            size="small"
            style={{ width: '140px' }}
            onChange={event => changeInputValue(uniqueKey, Number(event.target.value))}
          />
        )
      case DataType.BOOLEAN:
        return (
          <div>
          <Select
            size="small"
            style={{ width: '140px' }}
            value={true}
            onChange={(event) => {
              changeInputValue(uniqueKey, event.target.value)
            }}
          >
            <MenuItem value={true} label="true">
              true
            </MenuItem>
            <MenuItem value={false} label="false">
              false
            </MenuItem>
          </Select>
          </div>
        )
      default:
        return null
    }
  }
  return (
    <div className="addItem" key={uniqueKey}>
      {showIncreaseMap[uniqueKey] ? (
        <Stack direction="row" spacing={1}>
          {!isArray && (
            <div>
              <TextField
                size="small"
                style={{ width: '140px' }}
                onChange={event => changeInputKey(uniqueKey, event)}
              ></TextField>
            </div>
          )}
          <div>
            <Select
              size="small"
              style={{ width: '140px' }}
              onChange={event => onChangeTempType(uniqueKey, event.target.value)}
              defaultValue={DataType.STRING}
            >
              {Object.values(DataType).map(item => (
                <MenuItem 
                  value={item}
                  key={item}
                  style={{ width: '140px' }}
                >
                  {item}
                </MenuItem >
              ))}
            </Select>
          </div>
          {getTypeTemplate(templateData[uniqueKey]['type'] || DataType.STRING)}
          <div>
            <Stack>
              <Button
                size="small"
                type="primary"
                onClick={() => onConfirmIncrease(uniqueKey, sourceData)}
              >
                Confirm
              </Button>
              <Button
                size="small"
                onClick={() => onClickIncrease(uniqueKey, false)}
              >
                Cancel
              </Button>
            </Stack>
          </div>
        </Stack>
      ) : (
        <Box span={8}>
          <AddBoxOutlinedIcon
            style={{ color: '#1E88E5' }}
            onClick={() => onClickIncrease(uniqueKey, true)}
          />
        </Box>
      )}
    </div>
  )
}
export default AddItem