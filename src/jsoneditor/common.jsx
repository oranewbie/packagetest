export const DataType ={
    STRING : 'string',
    NUMBER : 'number',
    BOOLEAN : 'boolean',
    OBJECT : 'object',
    ARRAY : 'array',
  }
  
  export const typeMap = {
    [DataType.STRING]: '',
    [DataType.BOOLEAN]: true,
    [DataType.NUMBER]: 0,
    [DataType.OBJECT]: {},
    [DataType.ARRAY]: [],
  }
  
  export const getTypeString = (element) => {
    return Object.prototype.toString
      .call(element)
      .match(/\w+/g)?.[1]
      .toLowerCase()
  }
  
  const setNewValue = (keys, obj, newElement) => {
    const index = keys.shift()
    const objKeys = Object.keys(obj)
    if (keys.length) {
      return setNewValue(keys, obj[objKeys[index]], newElement)
    }
    obj[objKeys[index]] = newElement
  }
  
  export const getQuoteAddress = (
    newElement,
    indexKeys,
    currentData
  ) => {
    setNewValue(indexKeys, currentData, newElement)
    return currentData
  }
  
  export const getKeyList = (uniqueKey) => {
    // because first index is root index, don't find it.
    return uniqueKey.split('-').slice(1)
  }
  
  export const isObject = (value) => {
    return value && typeof value === 'object'
  }
  
  export const getPlaceholder = (value) => {
    if (!isObject(value)) return null
    const currentType = getTypeString(value)
    if (currentType === DataType.ARRAY) {
      return `Array [${value.length}]`
    } else {
      return `Object {${Object.keys(value).length}}`
    }
  }