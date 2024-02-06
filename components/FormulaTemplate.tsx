'use client'
import {
    bitable,
    FieldType,
    IField,
    IFieldMeta, IFormulaField,
    IGridView,
    IGridViewMeta,
    ITableMeta,
    ViewType
} from "@lark-base-open/js-sdk";
import {Button, Form, Notification, Select} from '@douyinfe/semi-ui';
import {useCallback, useEffect, useRef, useState} from 'react';
import {BaseFormApi} from '@douyinfe/semi-foundation/lib/es/form/interface';
import styles from './index.module.css';
import {getISOWeek} from "@/util/TimeUtils";
import {EnumDesc, FieldDesc, Formula, formulas, InputProperty, Property, PropertyType} from "./formula";
import usePageFocus from "@/components/hook/usePageFocus";
import Option from "@douyinfe/semi-ui/lib/es/select/option";


export default function FormulaTemplate() {
    // const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>();
    const [fieldMetaList, setFieldMetaList] = useState<IFieldMeta[]>();
    const [formulaIndex, setFormulaIndex] = useState<number>();
    const [tableId, setTableId] = useState<string>();
    const [formulaPreview, setFormulaPreview] = useState<string>();

    const [loading, setLoading] = useState(false);
    const formApi = useRef<BaseFormApi>();
    const formulaFormApi = useRef<BaseFormApi>();

    const formulaFormValueChange = (formData: object, changedValue: object) => {
        console.log('formulaFormValueChange', formData)
        let template = formulas[formulaIndex as number].template
        for (let key in formData) {
            // @ts-ignore
            if (formData[key]) {
                // @ts-ignore
                template = template.replaceAll(key, formData[key])
            }
        }
        setFormulaPreview(template)
        console.log('formulaPreview', template)
    }

    const submit = useCallback(async (formData: object) => {
        console.log('submit', JSON.stringify(formData))
        const table = await bitable.base.getTableById(tableId as string);
        console.log('table', table)
        const newFieldId = await table.addField({
            type: FieldType.Formula,
            name: formulas[formulaIndex as number].name + "-" + Math.random().toString(36).slice(-4),
            property: {
                formula: formulaPreview
            },
        });
        const setFieldResult = await table.setField(newFieldId, {
            property: {
                formula: formulaPreview
            },
        })
        console.log('setFieldResult', setFieldResult);

    }, [tableId, formulaPreview, formulaIndex]);

    usePageFocus(async () => {//页面焦点变更 重新获取字段列
        const activeTable = await bitable.base.getActiveTable()
        if (activeTable) {
            tableChanged(activeTable.id)
            console.log('重新获取到页面焦点, 刷新字段列')
        }
    })
    const tableChanged = async (value: string | number | any[] | Record<string, any>) => {
        console.log("tableChanged", value)
        const originTableId = tableId;
        setTableId(value as string)
        const table = await bitable.base.getTable(value as string)
        // 获取 table 下所有的附件字段
        const fieldMetaList = await table.getFieldMetaList();
        setFieldMetaList(fieldMetaList)
    }

    const formulaChanged = async (value: string | number | any[] | Record<string, any> | undefined) => {
        console.log("formulaChanged", value)
        setFormulaIndex(value as number)
    }

    function generateUIComponents(formula: Formula) {
        console.log('generateUIComponents')
        return (<div>
            {formula.property.map(property => {
                let component;
                switch (property.type) {
                    case PropertyType.Enum:
                        component = createEnumSelector(property);
                        break;
                    case PropertyType.Input:
                        component = createInput(property);
                        break;
                    case PropertyType.Field:
                        component = createFieldSelector(property);
                        break;
                }
                return component;
            })}
        </div>)
    }


    function createEnumSelector(property: Property) {
        const enumProperty = property.desc as EnumDesc
        return (
            <Form.Select field={property.name} label={property.name} placeholder={`请选择${property.name}`}
                         style={{width: '100%'}} rules={[{required: true, message: 'required error'}]}>
                {
                    Array.isArray(enumProperty) && enumProperty.enum.map(({label, key}) => {
                        return (
                            <Form.Select.Option key={key} value={key}>
                                {label}
                            </Form.Select.Option>
                        );
                    })
                }
            </Form.Select>
        )
    }

    function createInput(property: Property) {
        const inputProperty = property.desc as InputProperty
        return (
            <Form.Input field={property.name} label={property.name} placeholder={`请选择${property.name}`}
                        style={{width: '100%'}} rules={[{required: true, message: 'required error'}]}>
            </Form.Input>
        )
    }

    function createFieldSelector(property: Property) {
        const fieldProperty = property.desc as FieldDesc
        return (
            <Form.Select field={property.name} label={property.name} placeholder={`请选择${property.name}`}
                         style={{width: '100%'}} rules={[{required: true, message: 'required error'}]}>
                {
                    Array.isArray(fieldMetaList) && fieldMetaList.map(({name, id}) => {
                        return (
                            <Form.Select.Option key={name} value={name}>
                                {name}
                            </Form.Select.Option>
                        );
                    })
                }
            </Form.Select>
        )
    }

    return (
        <main className={styles.main}>
            <h1>公式助手</h1>
            <p>对于常用的一些公式提供便捷的配置方式</p>

            <h3>公式选择</h3>
            <Select placeholder="请选择公式"
                    style={{width: '100%'}} onChange={formulaChanged}>
                {
                    Array.isArray(formulas) && formulas.map((formula, index) => {
                        return (
                            <Option key={index} value={index}>
                                {formula.name}
                            </Option>
                        );
                    })
                }
            </Select>


            <h3>公式参数</h3>

            <Form labelPosition='inset' onSubmit={submit}
                  getFormApi={(baseFormApi: BaseFormApi) => formulaFormApi.current = baseFormApi}
                  onValueChange={formulaFormValueChange}>
                {formulaIndex !== undefined && generateUIComponents(formulas[formulaIndex])}
                <Button theme='solid' htmlType='submit' loading={loading} disabled={formulaIndex===undefined}>生成公式</Button>
            </Form>
            <div>
                <h3>公式预览</h3>
                <span>{formulaPreview}</span>
            </div>
        </main>
    )
}

