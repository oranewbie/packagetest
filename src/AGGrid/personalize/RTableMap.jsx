export class RTableMap { 

  constructor() {
    this.dataArr=new Map();
  }


  add(row, col, obj) {
    if (this.dataArr.get(row) == undefined) {
      this.dataArr.set(row, new Map())
    }
    this.dataArr.get(row).set(col, obj);
  }

  remove(row, col) {
    const rowMap = this.dataArr.get(row) ;
    if (rowMap == undefined)
      return;

    rowMap.delete(col)
  }

  get (row, col) {
    const rowMap = this.dataArr.get(row) ;
    if (rowMap == undefined)
      return undefined;
    return rowMap.get(col);
  }

  clearAll() {
    this.dataArr.clear()
  }
}

