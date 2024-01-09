import React, {forwardRef,useEffect,useImperativeHandle,useRef,useState,} from 'react';
import ReactDOM from 'react-dom';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import InputMask from "react-input-mask";
import { List, ListItemButton, TextField,ListItemText } from "@mui/material";
import InputAdornment from '@mui/material/InputAdornment';
import InsertInvitationOutlinedIcon from '@mui/icons-material/InsertInvitationOutlined';
  

let defDatetimeConfig= {
  showWeek: true,
  weekStartsOn: 0, // 0:일, 1:월, 2:화, 3:수, 4:목, 5:금, 6:토
  getWeekNumber: (currentDate) => {
    return getISOWeekNumber(currentDate)
  }
}

export function getISOWeekNumber(targetDate) {
  let target = new Date(targetDate);
  let startOfWeek = defDatetimeConfig.weekStartsOn
  let dayNr = (targetDate.getDay() + 7 - startOfWeek) % 7;

  target.setDate(target.getDate() - dayNr + 3);

  let firstThursday = target.valueOf();

  target.setMonth(0, 1);

  if (target.getDay() != 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }

  return 1 + Math.ceil((firstThursday - target) / 604800000);
}

const CustomTexInput = React.forwardRef(({ dateformat, value, onClick, onChange, readOnly, disabled, displaySize, label, variant, error, helperText, inputType, searchPosition, languageCode, 
  selectedDate,weekStartsOn, getWeekNumber,...others }, ref) => {
  const [myValue, setMyValue] = useState(value);
  const [myFormat, setMyFormat] = useState('9999-99-99');

  const classes = (inputType === 'floating') ? useFloatInputStyles({ displaySize, label, searchPosition, ...others }) : useInputStyles({ displaySize, label, variant, ...others });

  let week = '';
  let weekText = '';
  let includeProps = {};
  if (variant === 'filled') {
    includeProps = { disableUnderline: true }
  }

  //주차 포함시 
  let weekIndex = dateformat.indexOf("ww");
  let format = dateformat;
  if (weekIndex > -1) {
    format = format.substring(0, weekIndex - 1).trim();
    let weekNumberformat = dateformat.replace(format, '')

    //datetimepicker에서 만들어진 주차를 쓰지 않고 uiSettings에 설정된 넘을 쓴다.
    week = value.substring(weekIndex, weekIndex + 2);
    value = value.replace(/\([^)]*\)/g, '');
    value = value.trim();
  
    //partial week 계산
    if(selectedDate) {
      if(getWeekNumber)
        week = getWeekNumber(selectedDate)

      const firstWeekDate=firstDayOfWeek(selectedDate, weekStartsOn);
      const lastWeekDate = new Date(new Date(firstWeekDate).setDate(firstWeekDate.getDate() + 6));
      const firstWeekDateMonth = firstWeekDate.getMonth();
      const lastWeekDateMonth = lastWeekDate.getMonth();
      const curMonth=selectedDate.getMonth();
      if(firstWeekDateMonth != lastWeekDateMonth) { //partial week
        if(firstWeekDateMonth == curMonth)
          week = week +'A'
        else
          week = week +'B'
      }
    }
    
    weekText = weekNumberformat.replace('ww', '#' + week).replaceAll("'", '')

  } else {
    week = '';
  }

  format = format.replaceAll(/[a-zA-Z]/gim, 9);
  if (format != myFormat) {
    setMyFormat(format);
  }

  useEffect(() => {
    if (myValue != value) {
      setMyValue(value);
    }
  }, [value]);

  const isDateData = (val) => {
    if (val instanceof Date) {
      return true;
    } else if (typeof val == 'string') {
      if (myFormat.length === val.length)
        return true;
      else
        return false;
    }
    return false;
  }

  const editChange = (e) => {
    const inputVal = e.target.value;

    setMyValue(inputVal);

    if (isDateData(inputVal)) {
      onChange(e);
    } else if (inputVal === "") {
      onChange(e);
    }

    if (!inputVal) {
      value = '';
      week = '';
    }
  }

  return (
    <InputMask
      {...others}
      mask={myFormat}
      maskChar=""
      value={myValue}
      onChange={editChange}
      // className={others.rangeyn == 'Y' ? '' : `${others.className ?? others.className} ${classes.root} ${classes.datetime}`}
      disabled={disabled ? disabled : false}
    >
      {(others) =>
        <TextField
          {...others}
          onChange={editChange}
          size="small"
          variant={variant}
          // className={others.rangeyn == 'Y' ? '' : `${others.className ?? others.className} ${classes.root} ${classes.datetime}`}
          ref={ref}
          value={myValue}
          label={variant === 'filled' ? label : ''}
          error={!!error}
          inputProps={{
            readOnly: readOnly ? readOnly : false,
          }}
          sx={{border: 'none', "& fieldset": { border: 'none' },}}
          hiddenLabel={true} // TextField 옵션
          // TextField 옵션
          InputProps={{
            ...includeProps,
            // className: (readOnly) ? 'Mui-disabled' : undefined,
            // inputComponent: TextMaskCustom,
            endAdornment: (
              <>
                {week && <span>{weekText}</span>}
                <InputAdornment position="end" sx={{ cursor: (readOnly) ? 'default' : 'pointer' }}>
                  <InsertInvitationOutlinedIcon onClick={onClick} />
                </InputAdornment>
              </>
            ),
            ...others.InputProps
          }}
          // TextField 옵션
          FormHelperTextProps={{
            className: classes.helperText
          }}
          // TextField 옵션
          helperText={error && helperText?.[error.type]}
          style={{...others.style, margin:"0px 0px"}}
          disabled={disabled ? disabled : false}
        />
      }
    </InputMask>
  )
});

  export const CustomDateCellEditor= forwardRef((props, ref) => {
    const locale = props.locale
    
    const refDatePicker = useRef();
    const [date, setDate] = props.value ? useState(moment(props.value, 'DD MM YYYY').toDate()) : useState(props.value);
    const [editing, setEditing] = useState(true);
    const showTimeSelect = props.colDef.subtype === "datetime" ? true : false;
    const monthYearSelect = props.colDef.subtype === "month" ? true : false;
    const yearSelect = props.colDef.subtype === "year" ? true : false;

    let getWeekNumber  = defDatetimeConfig.getWeekNumber// getAppSettings('component').datetime.getWeekNumber;
    let weekStartsOn   = defDatetimeConfig.weekStartsOn//getAppSettings('component').datetime.weekStartsOn;
    let showWeek       = defDatetimeConfig.showWeek//getAppSettings('component').datetime.showWeek;
    let datetimeSettings = defDatetimeConfig.datetime//getAppSettings('component').datetime;
    let dateFormat = ""
    
    if (props.colDef.subtype === "date") {
      dateFormat = "yyyy-MM-dd"
    } else if (props.colDef.subtype === "datetime") {
      dateFormat = "yyyy-MM-dd HH:mm:ss"
    } else if (props.colDef.subtype === "month") {
      dateFormat = "yyyy-MM"
    } else if (props.colDef.subtype === "year") {
      dateFormat = "yyyy"
    } else {
      dateFormat = "yyyy-MM-dd"
    }
  
    useEffect(() => {
      if (!editing) {
        props.api.stopEditing();
      }
    }, [editing]);
  
    useImperativeHandle(ref, () => {
      return {
        getValue() {
          return isNaN(date) || isNaN(moment(date)._i) ? null : moment(date)._i;
        }
      };
    });
  
    const onChange = selectedDate => {
      if (selectedDate !== null) {
        setDate(selectedDate);
      } else {
        setDate(null);
      }
      setEditing(false);
    };

    const handleChangeRaw = (date) => {
      if (date.currentTarget.value != undefined) {
        let weekIndex = dateFormat.indexOf("ww");
        let format = dateFormat.substring(0, weekIndex - 1).trim();
  
        format = format.replaceAll(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/ ]/gim, "");
  
        let replaceVal = date.currentTarget.value.replaceAll(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/ ]/gim, "");
  
        if (replaceVal.length === format.length) {
          let dateVal = '';
          if (replaceVal.length === 6) {
            let yyIdx = format.indexOf('yy');
            let MMIdx = format.indexOf('MM');
            let ddIdx = format.indexOf('dd');
            dateVal = '20' + replaceVal.substr(yyIdx, 2) + '-' + replaceVal.substr(MMIdx, 2) + '-' + replaceVal.substr(ddIdx, 2);
          } else if (replaceVal.length === 8) {
            let yyyyIdx = format.indexOf('yyyy');
            let MMIdx = format.indexOf('MM');
            let ddIdx = format.indexOf('dd');
            dateVal = replaceVal.substr(yyyyIdx, 4) + '-' + replaceVal.substr(MMIdx, 2) + '-' + replaceVal.substr(ddIdx, 2);
          }
  
          const newRaw = new Date(dateVal);
          if (newRaw instanceof Date && !isNaN(newRaw)) {
            setDate(newRaw);
          }
        }
      }
    };
  
    return (
      <div>
        <DatePicker
          ref={refDatePicker}
          locale={locale}
          showWeekNumbers={showWeek}
          portalId="root"
          PopperProps={{
            sx: {
              '& .MuiPaper-root': {
                margin: '0px 0px',
              }
            }
          }}
          popperClassName="ag-custom-component-popup"
          selected={date}
          showMonthYearPicker={monthYearSelect}
          showYearPicker={yearSelect}
          dateFormat={dateFormat}
          onChangeRaw={(e) => handleChangeRaw(e)}
          onChange={(date) => onChange(date)}
          // locale={props.languageCode}
          maxDate={new Date(9999, 11, 31)}
          customInput={<CustomTexInput dateformat={dateFormat} //searchPosition={other.searchPosition} {...textParam}
                        selectedDate={date} weekStartsOn={weekStartsOn} getWeekNumber={getWeekNumber}/>}
          formatWeekNumber={getWeekNumber}
          weekLabel={props.weekLabel ?? "Wk"}
          showTimeSelect={showTimeSelect}
        />
        {/* <DatePicker
          className={props.className ? props.className : classes.zDateTimePicker}
          {...transParam}
          {...other}
          locale={props.languageCode}
          customInput={<CustomTexInput {...textParam} dateformat={transParam.dateFormat} searchPosition={other.searchPosition} selectedDate={selectedDate} weekStartsOn={weekStartsOn} getWeekNumber={getWeekNumber}/>}
        /> */}
      </div>
    );
  });