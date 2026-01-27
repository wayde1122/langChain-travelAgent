## ADDED Requirements

### Requirement: User Authentication

系统 SHALL 提供用户认证功能，支持邮箱密码注册和登录。

#### Scenario: User registration success

- **WHEN** 用户提供有效的邮箱和密码（至少 6 位）
- **THEN** 系统创建新用户账号
- **AND** 发送验证邮件到用户邮箱
- **AND** 返回成功状态

#### Scenario: User login success

- **WHEN** 用户提供正确的邮箱和密码
- **THEN** 系统验证凭据
- **AND** 创建认证会话
- **AND** 返回用户信息和访问令牌

#### Scenario: User logout

- **WHEN** 已登录用户请求登出
- **THEN** 系统清除认证会话
- **AND** 重定向到首页

### Requirement: Session Management

系统 SHALL 提供对话会话管理功能，每个对话独立存储为一个会话。

#### Scenario: Create new session

- **WHEN** 已登录用户开始新对话
- **THEN** 系统创建新的会话记录
- **AND** 会话标题默认为"新对话"
- **AND** 返回会话 ID

#### Scenario: List user sessions

- **WHEN** 已登录用户请求会话列表
- **THEN** 系统返回该用户的所有会话
- **AND** 按更新时间降序排列
- **AND** 只返回当前用户的会话（数据隔离）

#### Scenario: Switch session

- **WHEN** 用户选择历史会话
- **THEN** 系统加载该会话的所有消息
- **AND** 恢复对话上下文
- **AND** 更新当前会话 ID

#### Scenario: Delete session

- **WHEN** 用户删除会话
- **THEN** 系统删除会话及其所有消息
- **AND** 从会话列表中移除

#### Scenario: Rename session

- **WHEN** 用户重命名会话
- **THEN** 系统更新会话标题
- **AND** 更新会话的 updated_at 时间戳

### Requirement: Message Persistence

系统 SHALL 自动将对话消息持久化到数据库。

#### Scenario: Save user message

- **WHEN** 已登录用户发送消息
- **THEN** 系统将消息保存到数据库
- **AND** 关联到当前会话
- **AND** 记录消息角色为 "user"

#### Scenario: Save assistant message

- **WHEN** AI 助手生成回复
- **THEN** 系统将回复保存到数据库
- **AND** 关联到当前会话
- **AND** 记录消息角色为 "assistant"
- **AND** 如有工具调用，保存 tool_calls JSON

#### Scenario: Load session messages

- **WHEN** 用户切换到某个会话
- **THEN** 系统从数据库加载该会话的所有消息
- **AND** 按创建时间升序排列
- **AND** 恢复工具调用步骤（如有）

### Requirement: Anonymous Mode

系统 SHALL 支持未登录用户使用，对话存储在本地。

#### Scenario: Anonymous user chat

- **WHEN** 未登录用户发送消息
- **THEN** 系统正常处理聊天请求
- **AND** 对话历史存储在 localStorage
- **AND** 不调用数据库

#### Scenario: Import local data after login

- **WHEN** 用户登录后存在本地对话数据
- **THEN** 系统提示是否导入到云端
- **AND** 用户确认后创建新会话保存消息
- **AND** 清理 localStorage 数据

### Requirement: Auto Generate Session Title

系统 SHALL 支持根据对话内容自动生成会话标题。

#### Scenario: Generate title after first exchange

- **WHEN** 新会话完成首次对话交换
- **AND** 会话标题仍为默认值"新对话"
- **THEN** 系统根据对话内容生成简短标题
- **AND** 标题长度不超过 20 个字符
- **AND** 更新会话标题
