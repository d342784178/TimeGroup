'use client'
import {bitable, FieldType, IField, IFieldMeta, ITable} from "@lark-base-open/js-sdk";
import {Form} from '@douyinfe/semi-ui';
import {ReactNode, useCallback, useRef, useState} from 'react';
import {BaseFormApi} from '@douyinfe/semi-foundation/lib/es/form/interface';
import styles from './index.module.css';
import usePageFocus from "@/components/hook/usePageFocus";
import TimeArchive from "@/components/archive/TimeArchive";


export default function Archive() {
    const [fieldMetaList, setFieldMetaList] = useState<IFieldMeta[]>();
    const [table, setTable] = useState<ITable>();
    const [fieldMeta, setFieldMeta] = useState<IFieldMeta>();

    const [loading, setLoading] = useState(false);


    usePageFocus(async () => {//页面焦点变更 重新获取字段列
        const activeTable = await bitable.base.getActiveTable()
        if (activeTable) {
            tableChanged(activeTable.id)
            console.log('重新获取到页面焦点, 刷新字段列')
        }
    })
    const tableChanged = async (value: string | number | any[] | Record<string, any>) => {
        console.log("tableChanged", value)
        const table = await bitable.base.getTable(value as string)
        setTable(table)
        const fieldMetaList = await table.getFieldMetaList();
        setFieldMetaList(fieldMetaList)
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
            <p>对字段进行条件归档</p>

            <Form>
                <Form.Select field='field' label='字段选择' placeholder="Please select a Field"
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

            <h3>归档条件</h3>
            {generateUIComponents()}

        </main>
    )
}

