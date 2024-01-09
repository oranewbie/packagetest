import { Button } from "@mui/material";
import React from "react";

class CellButtonRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonText: this.props?.buttonText ?? '...',
      cellValue: this.props?.value,
      buttonVisibility: this.props?.buttonVisibility !== undefined ? this.props?.buttonVisibility : true,
    };

    if (props?.buttonText !== undefined) {
      this.buttonText = props.buttonText
    }

    this.displayValue = props?.displayValue !== undefined ? props.displayValue : true

    this.startAdornment = props?.startAdornment ?? <></>
    this.endAdornment = props?.endAdornment ?? <></>
  }
  componentDidMount() {
    //console.log('componentDidMount::')
  }
  componentDidUpdate(prevProps) {
    let field = prevProps.colDef?.field

    if (prevProps.data?.[field] != this.state.cellValue) {
      this.setState((state) => {
        return { ...state, cellValue: prevProps.data[field] }
      });
    }
  }

  render() {
    return (
      <span>
        {this.startAdornment}
        {this.displayValue ? this.state.cellValue : null}
        {this.state.buttonVisibility ? <Button
          size="small"
          style={{ width: '25px', minWidth: '25px', margin: '0px', height: '15px' }}
          onClick={this.props.onClick}
        >{this.state.buttonText}
        </Button> : <></>
        }
        {this.endAdornment}
      </span>
    )
  }
}

export default CellButtonRenderer;