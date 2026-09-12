package com.snoopy.mykey;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle state){
   registerPlugin(NativeVaultPlugin.class);
   getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,WindowManager.LayoutParams.FLAG_SECURE);
   super.onCreate(state);
 }
}
