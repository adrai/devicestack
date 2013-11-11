## v1.9.6
- catch error of command callback and task callback

## v1.9.5
- handle errors while connecting

## v1.9.4
- do not call callback twice if error is throwing on consumer callback
- stabilize frame handler

## v1.9.3
- removed postinstall script for optionalDependencies

## v1.9.2
- added postinstall script for optionalDependencies

## v1.9.1
- delete connection if not needed anymore
- better errors for example if calling connect twice

## v1.9.0
- implemented optional arguments validation by JSON schema for commands and tasks

## v1.8.7
- impemented has function for Device and Connection
- Warning! initialize function now passes connection as first argument and after that all other arguments passed by the constructor!
- refacotred error objects

## v1.8.6
- Connection: moved function isByteArray to Array.isByteArray

## v1.8.5
- Connection: added function isByteArray

## v1.8.4
- print some error messages

## v1.8.3
- connection: added dequeueCommand function

## v1.8.2
- The Enum type is not included automatically in devicestack. Please use it directly from [enum](https://github.com/adrai/enum).

## v1.8.1
- connection: try to better catch errors while sending commands

## v1.8.0
- introduce connectionStateChanged on DeviceGuider

## v1.7.0
- introduce command and task validation (initialize function)

## v1.6.4
- updated dependencies

## v1.6.3
- DeviceGuider now emits connecting and disconnecting events

## v1.6.2
- added possibility to add multiple vid/pid pairs

## v1.6.1
- SerialDeviceLoader compare devices by lowercase port name
- emit error on device only if there are listeners

## v1.6.0
- implemented EventedSerialDeviceLoader (for USB devices that virtualizes the COM port)
- fix for SerialDeviceLoader (bug was only for non-global users)

## v1.5.1
- optimization for hibernate/sleep/standby

  ATTENTION! Connection: executeCommand -> sendCommand

## v1.5.0
- ftdi integration

  FtdiDevice
  FtdiSerialDevice
  FtdiDeviceLoader
  EventedFtdiDeviceLoader

## v1.4.0
- default serial device loaders uses the global serial device loader under the hood