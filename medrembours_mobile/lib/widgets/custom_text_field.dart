import 'package:flutter/material.dart';

class CustomTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final bool obscure;
  const CustomTextField({Key? key, required this.controller, required this.label, this.obscure = false}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      decoration: InputDecoration(border: const OutlineInputBorder(), labelText: label),
    );
  }
}
