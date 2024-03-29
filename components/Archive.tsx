'use client'
import {bitable, FieldType, IFieldMeta, ITable} from "@lark-base-open/js-sdk";
import {Button, Form, Table, Tooltip} from '@douyinfe/semi-ui';
import {ReactNode, useCallback, useRef, useState} from 'react';
import {BaseFormApi} from '@douyinfe/semi-foundation/lib/es/form/interface';
import styles from './index.module.css';
import usePageFocus from "@/components/hook/usePageFocus";
import TimeArchive from "@/components/archive/TimeArchive";


export default function Archive() {
    const [fieldMetaList, setFieldMetaList] = useState<IFieldMeta[]>();
    const [table, setTable] = useState<ITable>();
    const [tableName, setTableName] = useState<string>();
    const [fieldMeta, setFieldMeta] = useState<IFieldMeta>();
    const formApi = useRef<BaseFormApi>();

    const [fieldLoading, setFieldLoading] = useState(false);

    usePageFocus(async () => {//页面焦点变更 重新获取字段列
        const activeTable = await bitable.base.getActiveTable()
        if (activeTable && table?.id !== activeTable.id) {
            await tableChanged(activeTable.id)
            formApi.current?.setValues({field: null});
            setFieldMeta(undefined)
            console.log('重新获取到页面焦点, 刷新字段列')
        }
    })
    const tableChanged = async (value: string | number | any[] | Record<string, any>) => {
        console.log("tableChanged", value)
        const table = await bitable.base.getTable(value as string)
        setTable(table)
        setTableName(await table.getName())
        const fieldMetaList = await table.getFieldMetaList();
        console.log(fieldMetaList)
        let timeFieldMetaList = fieldMetaList.filter((fieldMeta) => {
            return fieldMeta.type === FieldType.DateTime || fieldMeta.type === FieldType.CreatedTime || fieldMeta.type === FieldType.ModifiedTime;
        });
        setFieldMetaList(timeFieldMetaList)
    }
    const fieldChanged = async (value: string | number | any[] | Record<string, any>) => {
        console.log("fieldChanged", value)
        const fieldMeta = await table?.getFieldMetaById(value as string);
        setFieldMeta(fieldMeta)
    }


    const generateUIComponents = useCallback(() => {
        console.log('generateUIComponents', fieldMetaList, fieldMeta)
        let component: ReactNode

        if (table && fieldMeta && fieldMetaList) {
            switch (fieldMeta.type) {
                case FieldType.Number:
                    component = (<TimeArchive table={table} fieldMeta={fieldMeta}/>)
                    break;
                case FieldType.DateTime:
                case FieldType.CreatedTime:
                case FieldType.ModifiedTime:
                    component = (<TimeArchive table={table} fieldMeta={fieldMeta}/>)
                    break;
            }
            return (<div>
                {component}
            </div>)
        } else {
            return (<div/>)
        }
    }, [table, fieldMeta]);


    return (
        <main className={styles.main}>
            <h1>归档助手</h1>
            <p>按照自然时间对数据进行归档</p>
            <div>
                <strong style={{fontSize: '15px'}}>当前表:</strong> {tableName}
            </div>
            <Form getFormApi={(baseFormApi: BaseFormApi) => formApi.current = baseFormApi}>
                <Form.Select field='field' label='归档字段' placeholder="Please select a Field" loading={fieldLoading}
                             style={{width: '100%'}} rules={[{required: true, message: 'required error'}]}
                             onChange={fieldChanged}>
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
            </Form>

            {/*<h3>归档条件</h3>*/}
            {generateUIComponents()}

        </main>
    )
}

