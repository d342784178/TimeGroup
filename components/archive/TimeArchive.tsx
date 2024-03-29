'use client'
import {bitable, FieldType, IAddFieldConfig, IFieldMeta, IRecord, ITable, ToastType} from "@lark-base-open/js-sdk";
import {Button, Form, Table, Tooltip} from '@douyinfe/semi-ui';
import {useCallback, useState} from "react";
import {getISOWeek} from "@/util/TimeUtils";

const base = bitable.base;
const columns = [
    {
        title: '分组',
        dataIndex: 'group',
        render: (text: string, record: [string, Array<IRecord>], index: number) => {
            return (
                <div>{
                    record[0] === '未知分组' ? (
                        <Tooltip content={'存在"归档字段"值为空的记录,请修正后重新触发归档预览'}
                                 position={'right'} visible={record[0] === '未知分组'}>
                            <span style={{backgroundColor: 'yellow'}}>{record[0]}</span>
                        </Tooltip>
                    ) : (
                        <span>{record[0]}</span>
                    )
                }
                </div>
            );
        },
    },
    {
        title: '数量',
        dataIndex: 'size',
        render: (text: string, record: [string, Array<IRecord>], index: number) => {
            return (
                <div>
                    {record[1].length}
                </div>
            );
        },
    }
];


export default function TimeArchive({table, fieldMeta}: { table: ITable, fieldMeta: IFieldMeta }) {

    const [loading, setLoading] = useState(false);
    const [groupType, setGroupType] = useState<string>();
    const [previewLoading, setPreviewLoading] = useState(false);
    const [archivePreview, setArchivePreview] = useState<Map<string, IRecord[]>>();

    const onSubmit = useCallback(async () => {
        setLoading(true)
        console.log('onSubmit', groupType)
        //生成分组信息
        let previewAcrhive = await preview(groupType as string);
        setArchivePreview(previewAcrhive)


        //清理归档表
        const originTableName = await table.getName()
        const tableList = await base.getTableList();
        for (const tableItem of tableList) {
            const tableName = await tableItem.getName();
            console.log(tableName, tableName.indexOf(originTableName + " (归档 "))
            if (tableName.indexOf(originTableName + " (归档 ") > -1) {
                await base.deleteTable(tableItem.id)
            }
        }

        //获取原始表格的所有字段信息
        const view = await table.getActiveView();
        const originFieldMetas = await view.getFieldMetaList();
        console.log('originFieldMetas', originFieldMetas)

        Promise.all([...previewAcrhive].map(async ([groupBy, records]: [string, IRecord[]], index) => {
            await createArchiveTable(originTableName + " (归档 " + groupBy + ")", records, originFieldMetas)
        })).then(() => {
            setLoading(false)
            bitable.ui.showToast({
                toastType: ToastType.info,
                message: '归档完成'
            })
        }).catch((e) => {
            console.error(e)
            setLoading(false)
            bitable.ui.showToast({
                toastType: ToastType.error,
                message: '归档异常:' + e
            })
        })
    }, [table, fieldMeta, groupType]);

    const onChange = useCallback(async (value: string | number | any[] | Record<string, any> | undefined) => {
        setPreviewLoading(true)
        setGroupType(value as string)
        setArchivePreview(await preview(value as string))
        setPreviewLoading(false)
    }, [table, fieldMeta]);

    async function preview(groupBy: string) {
        const records = await table.getRecords({pageSize: 5000});
        const field = await table.getFieldById(fieldMeta.id);
        const groupMap: Map<string, IRecord[]> = new Map<string, IRecord[]>();

        for (const record of records.records) {
            const cellValue = await field.getCellString(record.recordId);
            let timeGroupString;

            if (cellValue) {
                const date = new Date(cellValue);
                // 根据groupBy的值来决定如何分组
                switch (groupBy) {
                    case 'week':
                        const isoWeek = getISOWeek(date);
                        timeGroupString = `${isoWeek.startDateStr}至${isoWeek.endDateStr}`;
                        break;
                    case 'month':
                        timeGroupString = `${date.getFullYear()}年${date.getMonth() + 1}月`;
                        break;
                    case 'year':
                        timeGroupString = `${date.getFullYear()}年`;
                        break;
                    default:
                        throw new Error(`Unsupported groupBy value: ${groupBy}`);
                }
            } else {
                timeGroupString = `未知分组`;
            }

            if (!groupMap.has(timeGroupString)) {
                groupMap.set(timeGroupString, [])
            }
            // @ts-ignore
            groupMap.get(timeGroupString).push(record);
        }

        console.log('preview', groupMap)
        return groupMap;
    }


    async function createArchiveTable(tableName: string, records: IRecord[], originFieldMetas: IFieldMeta[]) {
        async function addFields() {
            const fieldIdMap = new Map<string, string>();
            for (let i = 0; i < originFieldMetas.length; i++) {
                const originFieldMeta = originFieldMetas[i];
                let newFieldConfig = {
                    type: originFieldMeta.type,
                    description: originFieldMeta.description,
                    property: originFieldMeta.property,
                    name: originFieldMeta.name,
                } as IAddFieldConfig;
                let newFieldId
                if (i == 0) {
                    const firstField = await newTable.getFieldByName('文本')
                    await newTable.setField(firstField.id, newFieldConfig)
                    newFieldId = firstField.id
                } else {
                    newFieldId = await newTable.addField(newFieldConfig);
                }
                if (originFieldMeta.type !== FieldType.Formula) {//公式类型不进行映射
                    fieldIdMap.set(originFieldMeta.id, newFieldId);
                } else {
                    // console.log('formulaField', await table.getFieldById(originFieldMeta.id))
                    console.log('formulaField', originFieldMeta)
                }
            }
            return fieldIdMap;
        }

        console.log('createArchiveTable', name, records)
        // 创建一个新的数据表
        const addTableResult = await base.addTable({
            name: tableName, // 给新表格一个名称
            fields: []
        });
        const newTable = await base.getTableById(addTableResult.tableId);
        const fieldIdMap = await addFields();
        await newTable.addRecords(records.map(originRecord => {
            const newRecordData = {};
            for (const [originFieldId, originFieldValue] of Object.entries(originRecord.fields)) {
                // 使用字段ID映射找到新表格中的字段ID, 公式类型不进行赋值
                const newFieldId = fieldIdMap.get(originFieldId);
                if (newFieldId && originFieldValue) {
                    // 将原始字段值赋给新表格的对应字段
                    // @ts-ignore
                    newRecordData[newFieldId] = originFieldValue;
                }
            }
            return {fields: newRecordData}
        }))
        console.log('created successfully: ' + name);
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
                <div>
                    <h3>归档预览</h3>
                    <p style={{fontSize: '13px'}}>{'将按照以下预览展示将数据进行分组归档'}</p>
                    <ul>
                        <li style={{fontSize: '12px'}}>不删除当前表数据,只会新创建归档数据表</li>
                        <li style={{fontSize: '12px'}}>如果归档数据表已存在则会覆盖</li>
                    </ul>
                    <Table columns={columns} dataSource={archivePreview && [...archivePreview]}
                           loading={previewLoading} pagination={false}/>
                </div>
                <br/>
                <Button theme='solid' htmlType='submit' loading={loading}
                        disabled={archivePreview && archivePreview.has('未知分组')}>进行归档</Button>
            </Form>
        </div>
    )
}

