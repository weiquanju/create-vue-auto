/* eslint-disable no-unused-vars */
import {
  Interface,
  BaseClass,
  Property,
  CodeGenerator,
  Surrounding,
  FileStructures as FileStructuresBase
} from 'pont-engine'

const apiPrefixMap = new Map([['/pet-hello', '/pet']])

const handleUrl = (url: string): string => {
  for (const [prefix, path] of apiPrefixMap) {
    // console.log(prefix, path, url)
    if (url.startsWith(path)) {
      return url.replace(new RegExp(path), prefix)
    }
  }
  return url
}
export class FileStructures extends FileStructuresBase {
  getDataSourcesTs() {
    const dsNames = this.getMultipleOriginsDataSourceName()
    return `
      ${dsNames
        .map((name) => {
          return `import { defs as ${name}Defs, ${name} } from './${name}';
          `
        })
        .join('\n')}
      export const defs = {
        ${dsNames.map((name) => `${name}: ${name}Defs,`).join('\n')}
      };
      export const API = {
        ${dsNames.join(',\n')}
      };
    `
  }
}

export default class MyGenerator extends CodeGenerator {
  surrounding = Surrounding.typeScript

  getInterfaceContentInDeclaration(inter: Interface) {
    const requestParams = inter.getRequestParams(this.surrounding)
    const paramsCode = inter.getParamsCode('Params', this.surrounding)

    return `
      export ${paramsCode}

      export type Response = ${inter.responseType}

      export const init: Response;

      export function request(${requestParams}): Promise<Response>;
    `
  }

  getBaseClassInDeclaration(base: BaseClass) {
    const originProps = base.properties

    base.properties = base.properties.map((prop) => {
      return new Property({
        ...prop,
        required: false
      })
    })

    const result = super.getBaseClassInDeclaration(base)
    base.properties = originProps

    return result
  }

  /** 获取总的类型定义代码 */
  getDeclaration() {
    const CommonDeclaration = this.getCommonDeclaration()
    const BaseClassesInDeclaration = this.getBaseClassesInDeclaration()
    const ModsDeclaration = this.getModsDeclaration()
    const str = [CommonDeclaration, BaseClassesInDeclaration, ModsDeclaration]
      .filter((i) => i)
      // .map((i) => `export ${i}`)
      .join('\n\n')
    return str
  }

  getPathParams(inter: Interface) {
    inter.parameters.forEach((item) => {
      if (item.in === 'path') {
        inter.path = inter.path.replace(
          new RegExp(`{(${item.name})}`),
          (allMatch, firstMatched) => {
            if (firstMatched) {
              return `$\{params.${firstMatched}\}`
            }
            return ''
          }
        )
      }
    })
    return inter.path
  }

  getInterfaceContent(inter: Interface) {
    const requestParams = inter.getRequestParams(this.surrounding)
    const paramsCode = inter
      .getParamsCode('Params', this.surrounding)
      .replace(/(\w+)\:/g, (matched, one) => `${one}!:` /**必传参数使用!前缀 */)
    const bodyCode = inter.getBodyParamsCode()
    const method = inter.method.toUpperCase()
    const formParams = inter.parameters.find((param) => param.in === 'formData')
    this.getPathParams(inter)

    return `
    /// <reference path="../../api.d.ts" />
    
    /**
     * @desc ${inter.description}
     */

    import type { AxiosResponse } from 'axios'
    import instance from '@/axios'

    ${paramsCode ? 'export ' + paramsCode : ''}

    export function request(${requestParams}): Promise<AxiosResponse<${inter.response.generateCode(
      inter.getDsName()
    )}>> {

      return instance.request({
        url: \`${handleUrl(inter.path)}\`,
        method: "${method}",${bodyCode ? '\ndata: body,' : ''}${paramsCode ? '\nparams,' : ''}${
      formParams ? '\ndata: form,' : ''
    }
        ...options
      });
    }
   `
  }
}
