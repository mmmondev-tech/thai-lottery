package com.thailottery.checker;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TicketScannerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
