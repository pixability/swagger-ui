import React, { Component } from "react"
import { Map } from "immutable"
import PropTypes from "prop-types"
import win from "core/window"
import { getExtensions } from "core/utils"

export default class ParameterRow extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    param: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    fn: PropTypes.object.isRequired,
    isExecute: PropTypes.bool,
    onChangeConsumes: PropTypes.func.isRequired,
    specSelectors: PropTypes.object.isRequired,
    pathMethod: PropTypes.array.isRequired,
    getConfigs: PropTypes.func.isRequired
  }

  constructor(props, context) {
    super(props, context)

    let { specSelectors, pathMethod, param } = props
    let defaultValue = param.get("default")
    let parameter = specSelectors.getParameter(pathMethod, param.get("name"), param.get("in"))
    let value = parameter ? parameter.get("value") : ""
    if ( defaultValue !== undefined && value === undefined ) {
      this.onChangeWrapper(defaultValue)
    }
  }

  componentWillReceiveProps(props) {
    let { specSelectors, pathMethod, param } = props
    let { isOAS3 } = specSelectors

    let example = param.get("example")
    let defaultValue = param.get("default")
    let parameter = specSelectors.getParameter(pathMethod, param.get("name"), param.get("in"))
    let enumValue

    if(isOAS3()) {
      let schema = param.get("schema") || Map()
      enumValue = schema.get("enum")
    } else {
      enumValue = parameter ? parameter.get("enum") : undefined
    }
    let paramValue = parameter ? parameter.get("value") : undefined

    let value

    if ( paramValue !== undefined ) {
      value = paramValue
    } else if ( example !== undefined ) {
      value = example
    } else if ( defaultValue !== undefined) {
      value = defaultValue
    } else if ( param.get("required") && enumValue && enumValue.size ) {
      value = enumValue.first()
    }

    if ( value !== undefined ) {
      this.onChangeWrapper(value)
    }
  }

  onChangeWrapper = (value) => {
    let { onChange, param } = this.props
    return onChange(param, value)
  }

  render() {
    let {param, onChange, getComponent, getConfigs, isExecute, fn, onChangeConsumes, specSelectors, pathMethod} = this.props

    let { isOAS3 } = specSelectors

    const { showExtensions } = getConfigs()

    // const onChangeWrapper = (value) => onChange(param, value)
    const JsonSchemaForm = getComponent("JsonSchemaForm")
    const ParamBody = getComponent("ParamBody")
    let inType = param.get("in")
    let bodyParam = inType !== "body" ? null
      : <ParamBody getComponent={getComponent}
                   fn={fn}
                   param={param}
                   consumes={ specSelectors.operationConsumes(pathMethod) }
                   consumesValue={ specSelectors.contentTypeValues(pathMethod).get("requestContentType") }
                   onChange={onChange}
                   onChangeConsumes={onChangeConsumes}
                   isExecute={ isExecute }
                   specSelectors={ specSelectors }
                   pathMethod={ pathMethod }
      />

    const ModelExample = getComponent("modelExample")
    const Markdown = getComponent("Markdown")
    const ParameterExt = getComponent("ParameterExt")

    let schema = param.get("schema")
    let type = isOAS3 && isOAS3() ? param.getIn(["schema", "type"]) : param.get("type")
    let isFormData = inType === "formData"
    let isFormDataSupported = "FormData" in win
    let required = param.get("required")
    let itemType = param.getIn(isOAS3 && isOAS3() ? ["schema", "items", "type"] : ["items", "type"])
    let parameter = specSelectors.getParameter(pathMethod, param.get("name"), param.get("in"))
    let value = parameter ? parameter.get("value") : ""
    let extensions = getExtensions(param)

    return (
      <tr>
        <td className="col parameters-col_name">
          <div className={required ? "parameter__name required" : "parameter__name"}>
            { param.get("name") }
            { !required ? null : <span style={{color: "red"}}>&nbsp;*</span> }
          </div>
          <div className="parameter__type">{ type } { itemType && `[${itemType}]` }</div>
          <div className="parameter__deprecated">
            { isOAS3 && isOAS3() && param.get("deprecated") ? "deprecated": null }
          </div>
          <div className="parameter__in">({ param.get("in") })</div>
          { !showExtensions || !extensions.size ? null : extensions.map((v, key) => <ParameterExt key={`${key}-${v}`} xKey={key} xVal={v} /> )}
        </td>

        <td className="col parameters-col_description">
          <Markdown source={ param.get("description") }/>
          {(isFormData && !isFormDataSupported) && <div>Error: your browser does not support FormData</div>}

          { bodyParam || !isExecute ? null
            : <JsonSchemaForm fn={fn}
                              getComponent={getComponent}
                              value={ value }
                              required={ required }
                              description={param.get("description") ? `${param.get("name")} - ${param.get("description")}` : `${param.get("name")}`}
                              onChange={ this.onChangeWrapper }
                              schema={ isOAS3 && isOAS3() ? param.get("schema") : param }/>
          }


          {
            bodyParam && schema ? <ModelExample getComponent={ getComponent }
                                                getConfigs={ getConfigs }
                                                isExecute={ isExecute }
                                                specSelectors={ specSelectors }
                                                schema={ schema }
                                                example={ bodyParam }/>
              : null
          }

        </td>

      </tr>
    )

  }

}
