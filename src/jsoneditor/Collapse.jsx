import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import React, { useContext } from 'react'
import { isObject } from './common'
import { ConfigContext } from './jsoneditorstore'

// type Props = {
//   uniqueKey: string
//   fieldValue: any
// }

function CollapsePart(props) {
  const { fieldValue, uniqueKey } = props
  const { onChangeAllow, allowMap } = useContext(ConfigContext)
  if (!isObject(fieldValue)) 
    return <span style={{ marginRight: '25px' }}></span>
  return (
    <span
      style={{ marginRight: '5px' }}
      onClick={() => onChangeAllow(uniqueKey)}
    >
      <ExpandMoreOutlinedIcon
        className={`expandmore ${!allowMap[uniqueKey] ? 'up' : 'down'}`}
      />
    </span>
  )
}
export default CollapsePart