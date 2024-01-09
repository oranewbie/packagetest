import React, { useContext } from 'react'
import { getPlaceholder, isObject } from './common'
import { ConfigContext } from './jsoneditorstore'

import AddItem from './AddItem'
import CollapsePart from './Collapse'
import ToolsView from './Tools'

// type Props = {
//   fieldValue: any[]
//   fieldKey: string
//   sourceData: any
//   getValue: any
//   deepLevel: numberl
//   parentUniqueKey: string
// }

function ArrayView(props) {
  const { allowMap } = useContext(ConfigContext)
  return (
    <div className="arrayContent">
      <div style={{ marginTop: '10px' }}>
        {props.fieldValue.map((item, index) => {
          const uniqueKey = `${props.parentUniqueKey}-${index}`
          return (
            <div className="indexLine" key={uniqueKey}>
              <span className="jsonKey">
                <span style={{ marginRight: '5px' }}>{index + 1}.</span>
              </span>
              <CollapsePart uniqueKey={uniqueKey} fieldValue={item} />
              {isObject(item) ? (
                <b className="mt15">{getPlaceholder(item)}</b>
              ) : null}
              {!allowMap[uniqueKey] && (
                <span className="jsonValue">
                  {props.getValue(
                    item,
                    index,
                    props.fieldValue,
                    props.deepLevel + 1,
                    uniqueKey
                  )}
                </span>
              )}
              {
                <ToolsView
                  uniqueKey={uniqueKey}
                  fieldValue={item}
                  fieldKey={`${index}`}
                  sourceData={props.fieldValue}
                />
              }
            </div>
          )
        })}
      </div>
      <div>
        <AddItem
          key={props.parentUniqueKey}
          uniqueKey={props.parentUniqueKey}
          deepLevel={props.deepLevel}
          sourceData={props.fieldValue}
        />
      </div>
    </div>
  )
}
export default ArrayView