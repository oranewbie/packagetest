'use strict';

import { useContentStore } from '@zionex/wingui-core/store/contentStore'

var winguiUtil = {};

winguiUtil.namespace = function (namespace) {
  var parts = namespace.split('.');
  if (parts[0] === 'winguiUtil') {
    parts = parts.slice(1);
  }

  var parent = winguiUtil;
  for (var i = 0, n = parts.length; i < n; i++) {
    var part = parts[i];
    if (!parent[part]) {
      parent[part] = {};
    }
    parent = parent[part];
  }
  return parent;
};

winguiUtil.namespace('winguiUtil.util.view');

winguiUtil.util.view.getCurrentViewId = function () {
  return useContentStore.getState().activeViewId;
};

winguiUtil.namespace('winguiUtil.util.date');

winguiUtil.util.date.calendar = (function () {
  var firstDayOfWeek = 1;

  return {
    getFirstDayOfWeek: function () {
      return firstDayOfWeek;
    },
    setFirstDayOfWeek: function (dayOfWeek) {
      firstDayOfWeek = dayOfWeek;
    },
    changeFirstDate: function (date) {
      var newDate = this.newDate(date);
      var diff = (newDate.getDay() + 7 - firstDayOfWeek) % 7;
      newDate.setDate(newDate.getDate() - diff);
      return newDate;
    },
    changeFirstDateISO: function (date) {
      var newDate = this.newDate(date);
      var diff = (newDate.getDay() + 6) % 7;
      newDate.setDate(newDate.getDate() - diff);
      return newDate;
    },
    getNextMonday: function (date) {
      var newDate = this.newDate(date);
      if (newDate.getDay() === 1) {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + (1 + 7 - newDate.getDay()) % 7);
      }
      return newDate;
    },
    getStartDateOfYear: function (date) {
      var newDate = this.toDate(date);

      var startDate = new Date(newDate.getFullYear(), 0, 1);
      if (startDate.getDay() === 0 || startDate.getDay() > 4) { // Friday: 5, Saturday: 6, Sunday: 0
        return this.getNextMonday(startDate);
      } else {
        return this.changeFirstDateISO(startDate);
      }
    },
    getMonthLastDay: function (date) {
      var newDate = this.toDate(date);
      var year = newDate.getFullYear();
      var month = newDate.getMonth() + 1;
      var last = new Date(year, month);
      last = new Date(last - 1);
      //console.log("result==>",last)
      return last;
    },
    getWeekOfYear: function (date) {
      var newDate = this.newDate(date);

      var nextDate = this.getNextMonday(newDate);
      if (nextDate.getFullYear() !== newDate.getFullYear()) {
        var nextYearStart = new Date(nextDate.getFullYear(), 0, 1);

        var nextYearStartDay = nextYearStart.getDay();
        if (1 < nextYearStartDay && nextYearStartDay <= 4) {
          return 1;
        }
      }

      var fromDate = this.getStartDateOfYear(newDate);
      var toDate = this.changeFirstDateISO(newDate);

      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(0, 0, 0, 0);

      var diffDays = (toDate.getTime() - fromDate.getTime()) / 86400000;

      var weekOfYear = Math.round(diffDays / 7) + 1;
      if (weekOfYear === 0) {
        weekOfYear = this.getWeekOfYear(this.changeFirstDateISO(newDate));
      }
      return weekOfYear;
    },
    toDate: function (date) {
      if (typeof date === 'string') {
        date = new Date(date.replace(/\./g, '-'));
      }
      return date;
    },
    newDate: function (date) {
      if (typeof date === 'string') {
        date = new Date(date.replace(/\./g, '-'));
      } else {
        date = new Date(date.getTime());
      }
      return date;
    },
    addDate: function (date, days) {
      var date = this.newDate(date);
      date.setDate(date.getDate() + days);
      return date;
    }
  };
})();

winguiUtil.util.date.getFirstDateOfPartialWeek = function (date) {
  var calendar = winguiUtil.util.date.calendar;

  date = calendar.newDate(date);
  if (date.getDay() === calendar.getFirstDayOfWeek()) {
    return date;
  }

  var year = date.getFullYear();
  var month = date.getMonth();

  date = calendar.changeFirstDate(date);
  if (month !== date.getMonth()) {
    date.setDate(1);
    date.setMonth(month);
    date.setFullYear(year);
  }
  return date;
};

winguiUtil.util.date.getFirstDayOfPartialWeek = function (date) {
  return winguiUtil.util.date.getFirstDateOfPartialWeek(date).getDay();
};

winguiUtil.util.date.toDateString = function (date) {
  date = winguiUtil.util.date.calendar.toDate(date);

  var dateArray = [
    date.getFullYear(),
    ('0' + (date.getMonth() + 1)).slice(-2),
    ('0' + (date.getDate())).slice(-2)
  ];

  return dateArray.join('-');
};
const WEEKDAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

winguiUtil.util.date.toPartialWeekString = function (date, isWeek, stdWeek) {
  var calendar = winguiUtil.util.date.calendar;

  date = calendar.toDate(date);
  let week = WEEKDAY[date.getDay()];

  var weekOfYear = calendar.getWeekOfYear(date);
  if (weekOfYear < 10) {
    weekOfYear = '0' + weekOfYear
  } else {
    weekOfYear = '' + weekOfYear;
  }

  var firstDate = winguiUtil.util.date.getFirstDateOfPartialWeek(date);
  if (isWeek == true) {
    return 'W' + weekOfYear;
  } else if (firstDate.getDay() === calendar.getFirstDayOfWeek()) {
    var nextDate = new Date(firstDate);
    nextDate.setDate(nextDate.getDate() + 6);
    if (date.getMonth() === nextDate.getMonth()) {
      return 'W' + weekOfYear;
    } else {
      return 'W' + weekOfYear + 'A';
    }
  } else {
    if (stdWeek === week) {
      return 'W' + weekOfYear ;
    } else {
      return 'W' + weekOfYear + 'B';
    }
  }
};

winguiUtil.util.date.parseString = function (target, regexp, index) {
  if (!regexp) {
    regexp = /\d{4}-\d{2}-\d{2}/;
  }

  if (!index) {
    index = 0;
  }

  var pattern = target.match(regexp);
  if (!pattern) {
    return '';
  }

  var results = pattern.concat();
  if (index < results.length) {
    return results[index];
  }

  return '';
}

winguiUtil.util.date.toLastDateString = function (dateColumnName, regexp) {
  var dateString = winguiUtil.util.date.parseString(dateColumnName, regexp);

  var newDate = winguiUtil.util.date.calendar.toDate(dateString);
  newDate.setMonth(newDate.getMonth() + 1);
  newDate.setDate(newDate.getDate() - 1);

  return winguiUtil.util.date.toDateString(newDate);
}

winguiUtil.util.date.toMonthlyString = function (date) {
  date = winguiUtil.util.date.calendar.toDate(date);
  return 'M' + ('0' + (date.getMonth() + 1)).slice(-2);
};

winguiUtil.util.date.toQuaterString = function (date) {
  date = winguiUtil.util.date.calendar.toDate(date);
  var month = date.getMonth() + 1;
  var quaterInfo = (Math.ceil(month / 3));
  return 'Q' + quaterInfo;
};

winguiUtil.util.date.toYearString = function (date) {
  date = winguiUtil.util.date.calendar.toDate(date);
  return 'Y' + date.getFullYear();
};

winguiUtil.util.date.toDayString = function (date) {
  date = winguiUtil.util.date.calendar.toDate(date);
  var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
  return days[date.getDay()];
};

winguiUtil.util.date.toDate = function (dateStr, splitStr) {
  var dateSplit = dateStr.split(splitStr);
  var year = dateSplit[0];
  var month = dateSplit[1];
  var day = dateSplit[2];
  //console.log("split===>", [year, month, day]);
  var date = new Date(year, month - 1, day);
  return date;
}


export default winguiUtil;