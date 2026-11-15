import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        TreeSet<Integer> set = new TreeSet<>(Collections.reverseOrder());
        while (sc.hasNextInt()) set.add(sc.nextInt());
        if (set.size() < 2) { System.out.println(-1); return; }
        Iterator<Integer> it = set.iterator();
        it.next();
        System.out.println(it.next());
    }
}