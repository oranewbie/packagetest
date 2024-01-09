import React from "react";
import { CheckSquare, PlusSquare } from "react-feather";
class StateCellRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {rowState:this.props.value}
  }
  componentDidMount() {    
  }

  getIcon() {
    if (this.state.rowState === 'created') {
      return (<PlusSquare size={14} />)
    } else if (this.state.rowState === 'updated') {
      return (<CheckSquare size={14} />)
    }
  }
  componentDidUpdate(prevProps) {
    // console.log('componentDidUpdate::::')
    if(prevProps.value != this.props.value)
      this.setState({rowState:this.props.value})
  }
  render() {

    return (
      <span>{this.getIcon()}</span>
    )
  }
}


export default StateCellRenderer;