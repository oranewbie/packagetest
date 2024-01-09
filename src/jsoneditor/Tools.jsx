import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import { Select, MenuItem } from '@mui/material'
import React from 'react'
import { ConfigContext } from './jsoneditorstore'
import { getTypeString, DataType } from './common'

// props: {
//   fieldValue: any
//   fieldKey: string
//   uniqueKey: string
//   sourceData: any
// }

function ToolsView(props) {
  return (
    <ConfigContext.Consumer>
      {({ onChangeType, onClickDelete }) => (
        <span className="tools">
          <span>
            <Select
              size="small"
              style={{ width: '100px' }}
              onChange={value => onChangeType(value, props.uniqueKey)}
              defaultValue={getTypeString(props.fieldValue)}
            >
              {Object.values(DataType).map(item => (
                <MenuItem value={item} key={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </span>
          <span className="iconSubtraction">
            <IndeterminateCheckBoxOutlinedIcon
              style={{ color: '#E74C3C' }}
              onClick={() => onClickDelete(props.fieldKey, props.sourceData)}
            />
          </span>
        </span>
      )}
    </ConfigContext.Consumer>
  )
}
export default ToolsView