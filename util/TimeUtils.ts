export function getISOWeek(date: Date) {
    // // 根据日期对象创建一个新的Date实例
    // var currentThursday = new Date(date.getTime() + 3 * 86400000 - (date.getDay() + 6) % 7 * 86400000);
    //
    // var yearOfThursday = currentThursday.getFullYear();
    // var firstThursday = new Date(new Date(yearOfThursday, 0, 4).getTime() + 86400000 - (new Date(yearOfThursday, 0, 4).getDay() + 6) % 7 * 86400000);
    //
    // // 计算两个周四之间的周数
    // var weekNumber = Math.floor(1 + 0.5 + (currentThursday.getTime() - firstThursday.getTime()) / 86400000 / 7);

    const dateOfISOWeek = new Date(date.valueOf());
    dateOfISOWeek.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    dateOfISOWeek.setDate(dateOfISOWeek.getDate() + 3 - ((dateOfISOWeek.getDay() + 6) % 7));
    // January 4 is always in the first week of the year.
    const yearStart = new Date(dateOfISOWeek.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to yearStart.
    yearStart.setHours(0, 0, 0);
    yearStart.setDate(yearStart.getDate() + 3 - ((yearStart.getDay() + 6) % 7));
    const weekNumber = 1 + Math.round(((dateOfISOWeek.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000) - 0.5));
    const year = dateOfISOWeek.getFullYear();
    const weekDateRange = getWeekDateRange(year, weekNumber)
    return {
        weekNumber,
        year,
        weekNumberFormatStr: formatWeekString(weekNumber),
        ...weekDateRange
    };
}

// 将输入的字符串转换为字典序排序兼容的格式
function formatWeekString(weekNumber: number) {
    const number = String(weekNumber);
    // 填充零以保持字符串长度一致，假设最大数字为999
    return number.padStart(3, '0');
}

function getWeekDateRange(year: number, weekNumber: number) {
    function formatDate(date: Date) {
        // 格式化日期输出为yyyy-mm-dd格式
        return date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + "-" + date.getDate().toString().padStart(2, '0');
    }

    // 根据年份计算该年第一天
    var januaryFirst = new Date(year, 0, 1);
    // 计算该年第一天是周几
    var dayOfWeek = januaryFirst.getDay();
    // ISO 8601标准中，周一为一周的开始，周日为结束
    // 计算从年初到年中第一周周四的天数差
    // 根据ISO 8601，如果1月1日到1月4日之间有周四，则这一周为第一周
    var startOffset = (dayOfWeek <= 4 ? -1 : 6) - dayOfWeek + 4;
    // 计算第n周的第一天（周一）日期
    var weekStartDate = new Date(year, 0, 1 + startOffset + (weekNumber - 1) * 7);
    // 复制开始日期对象，增加6天得到周日日期
    var weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    return {
        start: weekStartDate,
        end: weekEndDate,
        startDateStr: formatDate(weekStartDate),
        endDateStr: formatDate(weekEndDate)
    };
}
