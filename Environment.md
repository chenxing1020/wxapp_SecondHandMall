# 在阿里云ECS上部署nodejs环境

## **安装依赖**

```
yum install git vim openssl wget curl
```
* 安装nvm : 在同一台机器上安装和切换不同版本node的工具。
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
```
安装完记得重启ssh。
```
nvm ls      //显示当前的node版本
nvm install 10.11.0     //安装最新的node10.11.0版本
nvm alias default 10.11.0          //将10.11.0设置为默认版本
```
* 运行node例程（使用vi server.js）
```
vi server.js        //生成一个js文件，复制下面的文本
```
vim命令：**esc**退出编辑，**：wq\!** 命令保存
```javascript
const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```
运行node server，打开3000端口监听，再另开一个ssh中断，访问本地端口
```
curl http://127.0.0.1:3000      //显示hello world
```
* 安装npm和pm2模块
```
yum install npm
npm install pm2 -g
```
pm2是一个带有负载均衡功能的Node应用的进程管理器。当你要把你的独立代码利用全部的服务器上的所有CPU，并保证进程永远都活着，0秒的重载，PM2是完美的。

| 命令 |作用|
|:---:|---|
|pm2 start server.js | 启动server程序，此时不需要另外开启终端，3000端口就会一直处于监听|
|pm2 list|显示当前运行的node程序|
|pm2 show server|查看server程序的详细信息|
|pm2 stop server|停止server程序|
|pm2 restart server|重启server程序|
|pm2 logs|查看日志|

* 安装nignx
```
yum install nginx
nginx -v
cd /etc/nginx/conf.d
```
---
## **Centos7远程连接MongoDB27017端口**

安装完mongodb之后，在本地使用compass可视化访问服务器的MongoDB的时候报错提示**timeout**，telnet 27017端口也失败。原因是Centos设置了防火墙，同时阿里云也设置了安全组。  
* 首先，修改mongo.conf配置文件
```
sudo vi /etc/mongo.conf
```
&emsp;&emsp;将**bindIp:127.0.0.1**修改为**0.0.0.0**，表示接受任何IP的连接。  
&emsp;&emsp;然后，重新启动MongoDB服务。
```
service mongod restart
```
* 接着，开放防火墙27017端口  

&emsp;&emsp;Centos7取消了iptables的配置，默认安装了firewalld，配置指令为firewall-cmd：
```
firewall-cmd --zone=public --permanent --add-port=27017/tcp       //--permanent参数将端口永久打开
firewall-cmd --permanent --zone=public --list-ports   //查看已经开启的端口
firewall-cmd --reload     //重启firewall
```
* 最后，还需要设置阿里云的安全组  
>参考文档：<a herf="https://jingyan.baidu.com/article/03b2f78c31bdea5ea237ae88.html">开启阿里云服务器端口</a>

&emsp;&emsp;进入阿里云ECS服务器控制台，找到安全组配置，点击配置规则，再点击添加安全组规则，在弹出的窗口中输入端口27017/27017,授权对象为0.0.0.0/0即可。

---
## **配置小程序的HTTPS环境**
>参考文档：  
>1.[博客园：Nodejs+Express创建HTTPS服务器](https://www.cnblogs.com/handongyu/p/6260209.html)  
>2.[关于NodeJS配置HTTPS服务、阿里云申请HTTPS证书Script](https://www.aliyun.com/jiaocheng/992136.html)  

---
## **用Redis缓存用户登录态**
>参考文档：  
>1.[博客园：CENTOS7下安装REDIS](https://www.cnblogs.com/zuidongfeng/p/8032505.html)   
>2.[npm:redis](https://www.npmjs.com/package/redis)

---
## **Express4.x新特性**
>参考文档：[Moving to Express 4](http://www.expressjs.com.cn/guide/migrating-4.html)  

* **更新所有依赖**  
手动修改dependencies中包的版本号太过麻烦，所以需要借助**npm-check-updates**工具将package.json中的依赖包更新到最新版本。  
```
npm install -g npm-check-updates        //安装
ncu -u      //更新dependencies到新版本
```


* **移除内置中间件**  
4.x版本将之前内置的所有中间件除了`static`都分离为单独的模块。4.x中各个模块需要单独安装，并在js文件中导入依赖。  

```javascript
//3.x代码
app.configure(funtcion(){
    app.use(express.static(__dirname+'/public'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
})
```
  
```javascript
//4.x代码
var express=require('express');
var morgan=require('morgan');//logger模块的新名字
var bodyParser=require('body-parser');
var methodOverride=require('method-override');
var app=express();

app.use(express.static(__dirname+'/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride());
```
* **移除app.configure方法**  
使用`process.env.NODE_ENV`或者`app.get('env')`来检测环境并相应的配置应用程序。  

```javascript
//3.x代码
app.configure('development', function() {
   // configure stuff here
});
```

```javascript
//4.x代码
var env = process.env.NODE_ENV || 'development';            //控制台中需要设置环境变量set NODE_ENV=test
if ('test' == env) {
   // configure stuff here
}
```

---
## **七牛云对象存储绑定域名**
>参考文档：[CSDN:七牛云外链绑定自己域名](https://blog.csdn.net/weixin_38187317/article/details/83987258)


&emsp;&emsp;在参照参考文档3绑定域名前，搞清域名解析的概念，域名解析就是域名到IP地址的转换过程：其中，A记录就是制定域名对应的IP地址记录；CNAME记录就是别名指向，用子域名来代替IP地址。所以绑定域名就相当于把自己备案的二级域名解析到七牛的服务器上。

---
## nginx配置https

>参考文档：  
>1. [使用Nginx反向代理nodejs http和https](https://www.jianshu.com/p/6a02a4f17701)  
>2. [Nginx安装SSL配置HTTPS超详细完整全过程](https://www.hack520.com/481.html)

配置nginx.conf定义http的重定向。

```
server {
    server_name www.clhw.xyz;
    listen 443 ssl;
    ssl_certificate /root/nginx/cert/cert.pem;
    ssl_certificate_key /root/nginx/cert/cert.key;
    ssl_session_timeout 5m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header X-Nginx-Proxy true;
    }
}
```