export function getISOWeek(date: Date) {
    // 根据日期对象创建一个新的Date实例
    var currentThursday = new Date(date.getTime() + 3 * 86400000 - (date.getDay() + 6) % 7 * 86400000);

    // 计算1月1日
    var yearOfThursday = currentThursday.getFullYear();
    var firstThursday = new Date(new Date(yearOfThursday, 0, 4).getTime() + 86400000 - (new Date(yearOfThursday, 0, 4).getDay() + 6) % 7 * 86400000);

    // 计算两个周四之间的周数
    var weekNumber = Math.floor(1 + 0.5 + (currentThursday.getTime() - firstThursday.getTime()) / 86400000 / 7);

    const weekDateRange = getWeekDateRange(yearOfThursday, weekNumber)
    return {
        weekNumber,
        ...weekDateRange
    };
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
