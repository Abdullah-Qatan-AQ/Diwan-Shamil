import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

const String earnlyUrl = String.fromEnvironment('EARNLY_URL', defaultValue: 'https://YOUR_SITE.vercel.app');

void main() => runApp(const EarnlyApp());

class EarnlyApp extends StatelessWidget {
  const EarnlyApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'Crypto Vault',
    theme: ThemeData(brightness: Brightness.dark, scaffoldBackgroundColor: const Color(0xff07111f), colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff74f7bf), brightness: Brightness.dark)),
    home: const EarnlyWebView(),
  );
}

class EarnlyWebView extends StatefulWidget {
  const EarnlyWebView({super.key});
  @override
  State<EarnlyWebView> createState() => _EarnlyWebViewState();
}

class _EarnlyWebViewState extends State<EarnlyWebView> {
  late final WebViewController controller;
  StreamSubscription<List<ConnectivityResult>>? connectivity;
  bool loading = true;
  bool offline = false;

  @override
  void initState() {
    super.initState();
    // Optional privacy hardening: prevent screenshots while viewing the wrapper.
    // Remove this line if your distribution needs screenshots.
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xff07111f))
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) => setState(() => loading = true),
        onPageFinished: (_) => setState(() { loading = false; offline = false; }),
        onWebResourceError: (_) => setState(() { loading = false; offline = true; }),
        onNavigationRequest: (request) => NavigationDecision.navigate,
      ))
      ..loadRequest(Uri.parse(earnlyUrl));
    connectivity = Connectivity().onConnectivityChanged.listen((results) {
      final disconnected = results.every((r) => r == ConnectivityResult.none);
      if (mounted) setState(() => offline = disconnected);
    });
  }

  @override
  void dispose() { connectivity?.cancel(); super.dispose(); }

  Future<void> reload() async { setState(() => offline = false); await controller.reload(); }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: Stack(children: [
      RefreshIndicator(
        color: const Color(0xff07111f), backgroundColor: const Color(0xff74f7bf),
        onRefresh: reload,
        child: WebViewWidget(controller: controller),
      ),
      if (loading) const LinearProgressIndicator(minHeight: 2, color: Color(0xff74f7bf), backgroundColor: Colors.transparent),
      if (offline) Center(child: Container(margin: const EdgeInsets.all(28), padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xff102238), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xff27415c))), child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.wifi_off_rounded, color: Color(0xffffca6b), size: 42), const SizedBox(height: 15),
        const Text('You appear to be offline', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)), const SizedBox(height: 8),
        const Text('Check your connection and try again.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xff9cacbf))), const SizedBox(height: 18),
        FilledButton(onPressed: reload, child: const Text('Try again')),
      ])) ),
    ])),
  );
}
