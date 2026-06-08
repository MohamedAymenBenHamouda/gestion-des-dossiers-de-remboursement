import 'package:flutter/material.dart';

class DossierCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback? onTap;
  const DossierCard({Key? key, required this.title, required this.subtitle, this.onTap}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(title),
        subtitle: Text(subtitle),
        onTap: onTap,
      ),
    );
  }
}
