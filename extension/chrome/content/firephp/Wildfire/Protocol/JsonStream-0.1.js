        
Wildfire.Protocol.JsonStream_0_1 = function() {

  this.PROTOCOL_URI = 'http://meta.wildfirehq.org/Protocol/JsonStream/0.1';
  
  this.plugins = new Array();
  this.plugin_ids = new Array();
  this.messages = new Array();
  this.structures = new Array();
  
  this.expectedMessageCount = 0;
  this.expectedStructureIDs = new Array();
  this.expectedPluginIDs = new Array();
  
  this.buffer = new Array();
  this.messageCount = 0;
  
  
  this.getURI = function()
  {
    return this.PROTOCOL_URI;
  };

  this.registerPlugin = function(Plugin) {
    for( var index in this.plugins ) {
      if(this.plugins==Plugin) {
        return false;
      }
    }
    this.plugins[Plugin.getURI()] = Plugin;
    return true;
  };

  this.receiveMessage = function(Key, Data) {
        
    var key = this.parseKey(Key);
      
    if(key[0]=='structure') {
      if(!this.structures[key[1]]) {
        this.structures[key[1]] = Data;
      }
    } else
    if(key[0]=='plugin') {

      if(!this.plugin_ids[key[1]]) {
        
        // split plugin URI removing the version from the end
        var index = Data.lastIndexOf('/');
        var uri = Data.substring(0,index+1);
        var version = Data.substring(index+1);

        if(this.plugins) {
          for( var plugin_uri in this.plugins ) {
            if(this.plugins[plugin_uri].isPeerPluginSupported(uri,version)) {
              
              this.plugins[plugin_uri].addPeerPlugin(uri,version);
              
              this.plugin_ids[key[1]] = plugin_uri;
              break;
            }
          }
        }
      }
    } else
    if(key[0]=='index') {

      this.expectedMessageCount = Data;
      
    } else {

      this.messages[key[2]] = [key[1],key[0],Data.substring(1,Data.length-1)];

      this.expectedStructureIDs[''+key[0]] = true;
      this.expectedPluginIDs[''+key[1]] = true;

      this.messageCount++;
    }
    
    // Once we have all messages received based on the message index
    // we flush them to the plugins
    
    if(this.messages
      && this.expectedMessageCount!=0
      && this.messageCount==this.expectedMessageCount
      && this.expectedStructureIDs.length == this.structures.length
      && this.expectedPluginIDs.length == this.plugin_ids.length) {
    
      this.messages = this.sortMessages(this.messages);
      
      for( var index in this.messages ) {

        var plugin = this.plugins[this.plugin_ids[this.messages[index][0]]];

        if(this.messages[index][2].length==4998) {
          
          this.buffer.push(this.messages[index][2]);
                      
        } else
        if(this.buffer.length>0) {

          plugin.receivedMessage(index,
                                 this.structures[this.messages[index][1]],
                                 this.buffer.join('')+this.messages[index][2]);

          this.buffer = new Array();
        
        } else {
          plugin.receivedMessage(index,
                                 this.structures[this.messages[index][1]],
                                 this.messages[index][2]);
        }
      }
      
      this.messages = new Array();    
    }
     
    return true;
  };
  
  this.allMessagesReceived = function() {
  };
  
  this.sortMessages = function(Messages) {
    array = new Array();
    var keys = new Array();
    for(k in Messages)
    {
         keys.push(k);
    }
    
    keys.sort( function (a, b) { 
        return a - b;
      }
    );
    
    
    for (var i = 0; i < keys.length; i++)
    {
      array[keys[i]] = Messages[keys[i]];
    }    
    return array;
  }
  
  
  this.parseKey = function(Key) {
    return Key.toLowerCase().split('-');
  };

  
}
