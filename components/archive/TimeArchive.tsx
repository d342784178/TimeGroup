'use client'
import {bitable, FieldType, IField, IFieldMeta, IGridView, ITable, ViewType} from "@lark-base-open/js-sdk";
import {Button, Form, Notification, Table} from '@douyinfe/semi-ui';
import {useCallback, useState} from "react";
import {getISOWeek} from "@/util/TimeUtils";


export default function TimeArchive({table, fieldMeta}: { table: ITable, fieldMeta: IFieldMeta }) {

    const [loading, setLoading] = useState(false);
    const [archivePreview, setArchivePreview] = useState<{ [key: string]: any[] }>();

    const onSubmit = useCallback(async () => {
        await preview()
    }, [table, fieldMeta]);

    const onChange = useCallback(async (value: string | number | any[] | Record<string, any> | undefined) => {
        setArchivePreview(await preview())
    }, [table, fieldMeta]);

    async function preview() {
        //获取时间字段列值,并计算自然周
        const records = await table.getRecords({pageSize: 5000}); // 获取记录列表
        const field = await table.getFieldById(fieldMeta.id); // 获取记录列表
        const recordsGroupedByWeek: { [key: string]: any[] } = {};
        //遍历一边计算出文档总数
        for (const record of records.records) {
            const cellValue = await field.getCellString(record.recordId);
            if (cellValue) {
                const date = new Date(cellValue);
                const isoWeek = getISOWeek(date);
                const yearWeekString = `${isoWeek.year}年第${isoWeek.weekNumber}周: ${isoWeek.startDateStr}-${isoWeek.endDateStr}`;

                if (!recordsGroupedByWeek[yearWeekString]) {
                    recordsGroupedByWeek[yearWeekString] = [];
                }
                recordsGroupedByWeek[yearWeekString].push(record);
            }
        }
        console.log(recordsGroupedByWeek)
        return recordsGroupedByWeek
    }


    return (
        <div>
            <Form onSubmit={onSubmit}>
                <Form.Select field={'type'} label={'归档参数'} placeholder={`请选择`} onChange={onChange}
                             style={{width: '100%'}} rules={[{required: true, message: 'required error'}]}>
                    <Form.Select.Option key={'year'} value={'year'} label={'自然年'}/>
                    <Form.Select.Option key={'month'} value={'month'} label={'自然月'}/>
                    <Form.Select.Option key={'week'} value={'week'} label={'自然周'}/>
                </Form.Select>
                <Button theme='solid' htmlType='submit' loading={loading}>进行归档</Button>
            </Form>
            <h3>归档预览</h3>
            <Table>
                {archivePreview && Object.entries(archivePreview).map(([yearWeek, records], index) => (
                    <tr key={index}>
                        <td>{yearWeek}</td>
                        <td>{records.length}</td>
                    </tr>
                ))}
            </Table>
        </div>
    )
}

