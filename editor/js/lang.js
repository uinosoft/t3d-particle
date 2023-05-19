
export function lang(value) {
	if (isZh) {
		return lang_zh[value] || value;
	} else {
		return value;
	}
}

const _lang = navigator.language || navigator.userLanguage;
const _isZh = _lang.substr(0, 2) === 'zh';

const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);
if (!params.has('lang')) {
	params.append('lang', _isZh ? 'zh' : 'en');
	url.search = params.toString();
	history.pushState(null, null, url.toString());
}

const isZh = params.get('lang') === 'zh';

const lang_zh = {
	'createGroup': '新建粒子组',
	'removeGroup': '删除粒子组',
	'importData': '导入数据',
	'exportData': '导出数据',
	'group': '粒子组',
	'texture': '纹理',
	'textureFrames': '纹理帧',
	'frameH': '横向帧数',
	'frameV': '纵向帧数',
	'textureLoop': '纹理循环',
	'mesh': '网格',
	'perspective': '透视',
	'colorize': '上色',
	'transparent': '透明',
	'blending': '混色',
	'alphaTest': '阿尔法测试',
	'depthWrite': '深度写入',
	'depthTest': '深度测试',
	'side': '渲染面',
	'fog': '雾效',
	'addEmitter': '添加粒子发射器',
	'removeEmitter': '删除粒子发射器',
	'emitter': '粒子发射器',
	'meshAlignment': '网格朝向',
	'particleCount': '粒子数量',
	'static': '静态',
	'direction': '方向',
	'activeMultiplier': '发射比率',

	'maxAge': '生命周期',
	'value': '数值',
	'spread': '方差',

	'distribution': '分布',
	'randomise': '随机',

	'position': '位置',
	'velocity': '速度',
	'acceleration': '加速度',
	'drag': '阻力',
	'rotation': '旋转',
	'rotationAxis': '旋转轴',
	'rotationAxisSpread': '旋转轴方差',
	'rotationCenter': '旋转中心',
	'color': '颜色',
	'opacity': '透明度',
	'size': '尺寸',
	'angle': '角度',

	'create': '创建',
	'remove': '移除'
};