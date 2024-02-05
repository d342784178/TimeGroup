'use client'
import {
    bitable,
    FieldType,
    IField,
    IFieldMeta,
    IGridView,
    IGridViewMeta,
    ITableMeta,
    ViewType
} from "@lark-base-open/js-sdk";
import {Button, Form, Notification} from '@douyinfe/semi-ui';
import {useCallback, useEffect, useRef, useState} from 'react';
import {BaseFormApi} from '@douyinfe/semi-foundation/lib/es/form/interface';
import styles from './index.module.css';
import {getISOWeek} from "@/util/TimeUtils";


export function Index() {
    const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>();
    const [fieldMetaList, setFieldMetaList] = useState<IFieldMeta[]>();
    const [loading, setLoading] = useState(false);
    const formApi = useRef<BaseFormApi>();
    const toGroup = useCallback(async ({table: tableId, field: fieldId}: { table: string, field: string }) => {
        if (tableId) {
            setLoading(true)
            try {
                const table = await bitable.base.getTableById(tableId);
                const timeField = await table.getFieldById(fieldId);

                //新增一列,用于存储自然周
                let naturalWeekField: IField;
                try {
                    naturalWeekField = await table.getFieldByName("自然周");
                } catch (e) {
                    const naturalWeekFieldId = await table.addField({
                        type: FieldType.Text,
                        name: '自然周',
                    });
                    naturalWeekField = await table.getFieldById(naturalWeekFieldId)
                }
                //获取时间字段列值,并计算自然周
                const records = await table.getRecords({pageSize: 5000}); // 获取记录列表
                for (const record of records.records) {
                    const cellValue = await timeField.getCellString(record.recordId)
                    // console.log('cellValue',cellValue)
                    if (cellValue) {
                        // 假设cellValue是一个日期字符串，你需要将其转换为日期对象，并计算自然周
                        const date = new Date(cellValue);
                        const weekOfYear = getISOWeek(date);
                        // 更新新字段的值
                        const setValueResult = await table.setCellValue(naturalWeekField.id, record.recordId, `第${weekOfYear.weekNumberFormatStr}周: ${weekOfYear.startDateStr}-${weekOfYear.endDateStr}`)
                        // console.log('setValueResult', setValueResult)
                    } else {
                        const setValueResult = await table.setCellValue(naturalWeekField.id, record.recordId, `0无分组`)
                    }

                }
                //新增一个视图用于展示分组
                let natualGridView
                const viewList = await table.getViewList()
                for (const view of viewList) {
                    if (await view.getName() === '按自然周分组' && await view.getType() === ViewType.Grid) {
                        natualGridView = view as IGridView
                    }
                }
                if (!natualGridView) {
                    const addViewResult = await table.addView({type: ViewType.Grid, name: '按自然周分组'});
                    // console.log('addViewResult:', addViewResult)
                    const natualView = await table.getViewById(addViewResult.viewId)
                    natualGridView = natualView as IGridView;
                }
                //按照新的一列进行分组
                const groupInfoResult = await natualGridView.getGroupInfo()
                if (!groupInfoResult.find(((sortInfo) => {
                    return sortInfo.fieldId === naturalWeekField.id
                }))) {
                    const addGroupResult = await natualGridView.addGroup({fieldId: naturalWeekField.id, desc: true})
                    // console.log('addGroupResult:', addGroupResult)
                }
                const hideFieldResult = await natualGridView.hideField(naturalWeekField.id)
                // console.log('hideFieldResult:', hideFieldResult)
                //切换视图
                const switchViewResult = await bitable.ui.switchToView(table.id, natualGridView.id);
                // console.log('switchViewResult:', switchViewResult)
                Notification.open({
                    title: '分组完成',
                    duration: 1,
                })
            } finally {
                setLoading(false)
            }
        }
    }, []);
    useEffect(() => {
        Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()])
            .then(([metaList, selection]) => {
                setTableMetaList(metaList);
                formApi.current?.setValues({table: selection.tableId});
                tableChanged(selection.tableId as string)
            });
    }, []);
    const tableChanged = async (value: string | number | any[] | Record<string, any>) => {
        console.log("tableChanged")
        const table = await bitable.base.getTable(value as string)
        // 获取 table 下所有的附件字段
        const fieldMetaList = await table.getFieldMetaList();
        console.log(fieldMetaList)
        let timeFieldMetaList = fieldMetaList.filter((fieldMeta) => {
            return fieldMeta.type === FieldType.DateTime || fieldMeta.type === FieldType.CreatedTime || fieldMeta.type === FieldType.ModifiedTime;
        });
        setFieldMetaList(timeFieldMetaList)
        if (timeFieldMetaList.length > 0) {
            formApi.current?.setValues({field: timeFieldMetaList[0].id, table: value});
        }
    }

    return (
        <main className={styles.main}>
            <h1>自然时间分组</h1>
            <p>可以根据选择的时间字段,按照自然周进行分组. (会新建一列用于存放自然周数据,并新建一个视图进行分组展示)</p>
            <Form labelPosition='top' onSubmit={toGroup}
                  getFormApi={(baseFormApi: BaseFormApi) => formApi.current = baseFormApi}>
                <Form.Select field='table' label='选择数据表' placeholder="Please select a Table"
                             style={{width: '100%'}} onChange={tableChanged} rules={[
                    {required: true, message: 'required error'},
                ]}>
                    {
                        Array.isArray(tableMetaList) && tableMetaList.map(({name, id}) => {
                            return (
                                <Form.Select.Option key={id} value={id}>
                                    {name}
                                </Form.Select.Option>
                            );
                        })
                    }
                </Form.Select>
                <Form.Select field='field' label='选择时间字段' placeholder="Please select a Field"
                             style={{width: '100%'}} rules={[
                    {required: true, message: 'required error'},
                ]}>
                    {
                        Array.isArray(fieldMetaList) && fieldMetaList.map(({name, id}) => {
                            return (
                                <Form.Select.Option key={id} value={id}>
                                    {name}
                                </Form.Select.Option>
                            );
                        })
                    }
                </Form.Select>
                <Button theme='solid' htmlType='submit' loading={loading}>进行分组</Button>
            </Form>
        </main>
    )
}