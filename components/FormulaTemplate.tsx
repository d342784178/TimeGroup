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


export default function FormulaTemplate() {
    const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>();
    const [fieldMetaList, setFieldMetaList] = useState<IFieldMeta[]>();
    const [formulaIndex, setFormulaIndex] = useState<number>();
    const [tableId, setTableId] = useState<string>();
    const [fieldId, setFieldId] = useState<string>();
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
    }

    const submit = useCallback(async (formData: object) => {
        const table = await bitable.base.getTableById(tableId as string);
        console.log('table', table)
        const field = await table.getFieldById(fieldId as string);
        console.log('field', field)
        console.log('formValus', JSON.stringify(formData))
        const newFieldId = await table.addField({
            type: FieldType.Formula,
            name: formulas[formulaIndex as number].name + "-" + Math.random().toString(36).slice(-4),
        });
        const setFieldResult = await table.setField(newFieldId, {
            type: FieldType.Formula,
            // name: '自然周',
            property: {
                formula: formulaPreview
            },
            // description: {content: '123123'}
        })
        console.log('setFieldResult', setFieldResult);

    }, [tableId, fieldId, formulaIndex]);
    useEffect(() => {
        Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()])
            .then(([metaList, selection]) => {
                setTableMetaList(metaList);
                formApi.current?.setValues({table: selection.tableId});
                tableChanged(selection.tableId as string)
            });
    }, []);

    usePageFocus(() => {//页面焦点变更 重新获取字段列
        if (tableId) {
            tableChanged(tableId)
            console.log('重新获取到页面焦点, 重新获取字段列')
        }
    })
    const tableChanged = async (value: string | number | any[] | Record<string, any>) => {
        console.log("tableChanged", value)
        setTableId(value as string)
        const table = await bitable.base.getTable(value as string)
        // 获取 table 下所有的附件字段
        const fieldMetaList = await table.getFieldMetaList();
        setFieldMetaList(fieldMetaList)
        if (fieldMetaList.length > 0) {
            fieldChanged(fieldMetaList[0].id)
            formApi.current?.setValues({field: fieldMetaList[0].id, table: value, formula: formulaIndex});
        }
    }

    const formulaChanged = async (value: string | number | any[] | Record<string, any>) => {
        console.log("formulaChanged", value)
        setFormulaIndex(value as number)
    }
    const fieldChanged = async (value: string | number | any[] | Record<string, any>) => {
        console.log("fieldChanged", value)
        setFieldId(value as string)
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
            <h1>自然时间分组</h1>
            <p>可以根据选择的时间字段,按照自然周进行分组. (会新建一列用于存放自然周数据,并新建一个视图进行分组展示)</p>
            <Form labelPosition='top' getFormApi={(baseFormApi: BaseFormApi) => formApi.current = baseFormApi}>
                <Form.Select field='table' label='选择数据表' placeholder="请选择数据表"
                             style={{width: '100%'}} onChange={tableChanged}
                             rules={[{required: true, message: 'required error'},]}>
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
                <Form.Select field='formula' label='选择公式' placeholder="请选择公式"
                             style={{width: '100%'}} onChange={formulaChanged} rules={[
                    {required: true, message: 'required error'},
                ]}>
                    {
                        Array.isArray(formulas) && formulas.map((formula, index) => {
                            return (
                                <Select.Option key={index} value={index}>
                                    {formula.name}
                                </Select.Option>
                            );
                        })
                    }
                </Form.Select>
                {/*<Form.Select field='field' label='选择公式列' placeholder="请选择公示列"*/}
                {/*             style={{width: '100%'}} onChange={fieldChanged} rules={[*/}
                {/*    {required: true, message: 'required error'},*/}
                {/*]}>*/}
                {/*    {*/}
                {/*        Array.isArray(fieldMetaList) && fieldMetaList.map(({name, id}) => {*/}
                {/*            return (*/}
                {/*                <Form.Select.Option key={id} value={id}>*/}
                {/*                    {name}*/}
                {/*                </Form.Select.Option>*/}
                {/*            );*/}
                {/*        })*/}
                {/*    }*/}
                {/*</Form.Select>*/}
            </Form>


            <Form labelPosition='top' onSubmit={submit}
                  getFormApi={(baseFormApi: BaseFormApi) => formulaFormApi.current = baseFormApi}
                  onValueChange={formulaFormValueChange}>
                {formulaIndex !== undefined && generateUIComponents(formulas[formulaIndex])}
                <Button theme='solid' htmlType='submit' loading={loading}>生成公式</Button>
            </Form>
            <div>
                <h4>公式预览</h4>
                <span>{formulaPreview}</span>
            </div>
        </main>
    )
}

